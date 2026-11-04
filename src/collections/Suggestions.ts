import type { CollectionAfterChangeHook, CollectionConfig, Where } from 'payload'

import {
  MEMBER_ROLES,
  anySiteAccess,
  isGroupAdmin,
  requireRoleAtSiteHook,
  siteIdsWithRole,
  siteScopedAccess,
} from '@/access/roles'
import { suggestionEmail } from '@/lib/emails'
import type { Recipe, Site, User } from '@/payload-types'

function idOf(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: number }).id
  return undefined
}

/** Emails every Editor and Site Admin at the recipe's site when a suggestion is created. */
const notifyEditors: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  const { payload } = req
  const recipeId = idOf(doc.recipe)
  const siteId = idOf(doc.site)
  if (!recipeId || !siteId) return doc

  try {
    const [recipe, site, submitter, editors, open] = await Promise.all([
      payload.findByID({
        collection: 'recipes',
        id: recipeId,
        depth: 1,
        overrideAccess: true,
        draft: true,
      }) as Promise<Recipe>,
      payload.findByID({
        collection: 'sites',
        id: siteId,
        depth: 1,
        overrideAccess: true,
      }) as Promise<Site>,
      payload.findByID({
        collection: 'users',
        id: idOf(doc.submittedBy) as number,
        depth: 0,
        overrideAccess: true,
      }) as Promise<User>,
      payload.find({
        collection: 'users',
        where: {
          and: [
            { 'memberships.site': { equals: siteId } },
            { 'memberships.role': { in: ['editor', 'siteAdmin'] } },
          ],
        },
        limit: 200,
        depth: 0,
        overrideAccess: true,
      }),
      payload.count({
        collection: 'suggestions',
        where: { and: [{ recipe: { equals: recipeId } }, { status: { equals: 'open' } }] },
        overrideAccess: true,
      }),
    ])

    const host = site.domains?.[0]?.hostname
    const origin = host ? `https://${host}` : req.origin || ''
    const tags = (recipe.tags ?? [])
      .map((t) => (typeof t === 'object' ? t.name : null))
      .filter(Boolean)
    const author = typeof recipe.author === 'object' ? recipe.author.name : ''
    const recipeMeta = [...tags, author ? `by ${author}` : ''].filter(Boolean).join(' · ')
    const when = new Date(doc.createdAt ?? Date.now()).toLocaleString('en-GB', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/London',
    })

    const message = suggestionEmail({
      site: { name: site.name, accent: site.accentColour ?? '#8B2D2D' },
      recipeTitle: recipe.title,
      recipeMeta,
      suggesterName: submitter.name,
      when,
      text: doc.body,
      adminUrl: `${origin}/admin/collections/recipes/${recipe.id}`,
      openCount: open.totalDocs,
    })

    const recipients = editors.docs
      .filter((u) =>
        u.memberships?.some(
          (m) => idOf(m.site) === siteId && (m.role === 'editor' || m.role === 'siteAdmin'),
        ),
      )
      .map((u) => u.email)
    for (const to of recipients) {
      await payload.sendEmail({ to, ...message })
    }
  } catch (error) {
    payload.logger.error({ err: error }, 'Could not send suggestion emails')
  }
  return doc
}

export const Suggestions: CollectionConfig = {
  slug: 'suggestions',
  admin: {
    useAsTitle: 'body',
    defaultColumns: ['recipe', 'submittedBy', 'status', 'createdAt'],
    group: 'Content',
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (isGroupAdmin(req.user)) return true
      const editorSites = siteIdsWithRole(req.user, ['editor', 'siteAdmin'])
      const clauses: Where[] = [{ submittedBy: { equals: req.user.id } }]
      if (editorSites.length) clauses.push({ site: { in: editorSites } })
      const where: Where = { or: clauses }
      return where
    },
    create: anySiteAccess(MEMBER_ROLES),
    update: siteScopedAccess(['editor', 'siteAdmin']),
    delete: siteScopedAccess(['siteAdmin']),
  },
  hooks: {
    beforeValidate: [requireRoleAtSiteHook(MEMBER_ROLES)],
    afterChange: [notifyEditors],
  },
  fields: [
    {
      name: 'recipe',
      type: 'relationship',
      relationTo: 'recipes',
      required: true,
      index: true,
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      defaultValue: ({ user }) => user?.id,
      admin: { readOnly: true },
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      maxLength: 2000,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Dismissed', value: 'dismissed' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'resolvedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'resolvedAt',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true },
      hooks: {
        beforeChange: [
          ({ siblingData, originalDoc, req }) => {
            if (siblingData.status !== 'open' && originalDoc?.status === 'open') {
              siblingData.resolvedBy = req.user?.id
              return new Date().toISOString()
            }
            if (siblingData.status === 'open') {
              siblingData.resolvedBy = null
              return null
            }
            return undefined
          },
        ],
      },
    },
  ],
}

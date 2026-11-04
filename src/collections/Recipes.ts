import {
  BoldFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { CollectionBeforeChangeHook, CollectionConfig, Where } from 'payload'

import {
  EDITOR_ROLES,
  MEMBER_ROLES,
  anySiteAccess,
  hasRoleAtSite,
  isGroupAdmin,
  requireRoleAtSiteHook,
  siteIdsWithRole,
  siteScopedAccess,
} from '@/access/roles'
import { slugify } from '@/lib/slugify'

export const UNITS = [
  { label: 'g', value: 'g' },
  { label: 'kg', value: 'kg' },
  { label: 'ml', value: 'ml' },
  { label: 'l', value: 'l' },
  { label: 'tsp', value: 'tsp' },
  { label: 'tbsp', value: 'tbsp' },
  { label: 'each', value: 'each' },
  { label: 'pinch', value: 'pinch' },
  { label: 'bunch', value: 'bunch' },
  { label: 'sheet', value: 'sheet' },
  { label: 'none', value: 'none' },
  { label: 'other', value: 'other' },
] as const

const stepEditor = lexicalEditor({
  features: [ParagraphFeature(), BoldFeature(), ItalicFeature(), LinkFeature()],
})

function extractSiteId(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id
    return typeof id === 'number' ? id : undefined
  }
  return undefined
}

/** Slugs must be unique within a site. Appends -2, -3 and so on when taken. */
const uniqueSlugWithinSite: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const siteId = extractSiteId(data.site ?? originalDoc?.site)
  const base = slugify(data.slug || data.title || '')
  if (!siteId || !base) return data

  let candidate = base
  for (let n = 2; n < 100; n++) {
    const clash = await req.payload.find({
      collection: 'recipes',
      where: {
        and: [
          { site: { equals: siteId } },
          { slug: { equals: candidate } },
          ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      draft: true,
    })
    if (clash.totalDocs === 0) break
    candidate = `${base}-${n}`
  }
  data.slug = candidate
  return data
}

/** Records who saved each version, so the history row can name them. */
const stampEditor: CollectionBeforeChangeHook = ({ data, req }) => {
  if (req.user) data.lastEditedBy = req.user.id
  return data
}

export const Recipes: CollectionConfig = {
  slug: 'recipes',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'tags', '_status', 'updatedAt'],
    group: 'Content',
  },
  versions: {
    drafts: true,
    maxPerDoc: 0,
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (isGroupAdmin(req.user)) return true
      const editorSites = siteIdsWithRole(req.user, EDITOR_ROLES)
      const viewerSites = siteIdsWithRole(req.user, ['viewer'])
      const clauses: Where[] = []
      if (editorSites.length) clauses.push({ site: { in: editorSites } })
      if (viewerSites.length) {
        clauses.push({
          and: [
            { site: { in: viewerSites } },
            { _status: { equals: 'published' } },
            { archived: { not_equals: true } },
          ],
        })
      }
      if (clauses.length === 0) return false
      const where: Where = { or: clauses }
      return where
    },
    readVersions: siteScopedAccess(MEMBER_ROLES),
    create: anySiteAccess(EDITOR_ROLES),
    update: siteScopedAccess(EDITOR_ROLES),
    delete: siteScopedAccess(['siteAdmin']),
  },
  hooks: {
    beforeValidate: [requireRoleAtSiteHook(EDITOR_ROLES)],
    beforeChange: [uniqueSlugWithinSite, stampEditor],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Generated from the title. Change it only if you need a specific address.',
      },
      hooks: {
        beforeValidate: [({ value, data }) => slugify(value || data?.title || '')],
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      defaultValue: ({ user }) => user?.id,
      admin: {
        position: 'sidebar',
        description: 'Who wrote this recipe. Site Admins can change it.',
      },
      access: {
        update: ({ req, doc }) => {
          if (isGroupAdmin(req.user)) return true
          const siteId = extractSiteId(doc?.site)
          return siteId !== undefined && hasRoleAtSite(req.user, siteId, ['siteAdmin'])
        },
      },
    },
    {
      name: 'lastEditedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { hidden: true },
    },
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Archived recipes are hidden from the front end but kept here.',
      },
    },
    {
      name: 'changeNote',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'What did you change? Shown in the recipe history.',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'yield',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'amount',
              type: 'number',
              required: true,
              min: 0.01,
              defaultValue: 1,
              admin: { width: '40%' },
            },
            {
              name: 'label',
              type: 'text',
              required: true,
              defaultValue: 'portions',
              admin: {
                width: '60%',
                description: 'For example portions, litres, trays, loaves.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'ingredientSections',
      type: 'array',
      label: 'Ingredients',
      labels: { singular: 'Section', plural: 'Sections' },
      minRows: 1,
      admin: {
        description:
          'One section is fine. Add more to group ingredients, for example "For the sauce".',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: { description: 'Optional section heading.' },
        },
        {
          name: 'ingredients',
          type: 'array',
          minRows: 1,
          labels: { singular: 'Ingredient', plural: 'Ingredients' },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'quantity',
                  type: 'number',
                  min: 0,
                  admin: { width: '25%' },
                },
                {
                  name: 'unit',
                  type: 'select',
                  options: [...UNITS],
                  defaultValue: 'g',
                  admin: { width: '25%' },
                },
                {
                  name: 'unitLabel',
                  type: 'text',
                  admin: {
                    width: '50%',
                    condition: (_, siblingData) => siblingData?.unit === 'other',
                    description: 'Custom unit',
                  },
                },
              ],
            },
            {
              name: 'item',
              type: 'text',
              validate: (
                value: unknown,
                { siblingData }: { siblingData: Record<string, unknown> },
              ) =>
                value || siblingData?.subRecipe
                  ? true
                  : 'Enter an ingredient or choose a sub-recipe.',
            },
            {
              name: 'subRecipe',
              type: 'relationship',
              relationTo: 'recipes',
              admin: { description: 'Link another recipe instead of naming an ingredient.' },
            },
            {
              name: 'note',
              type: 'text',
              admin: { description: 'For example "finely diced" or "room temperature".' },
            },
            {
              name: 'scales',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Untick for items like seasoning that stay the same at any yield.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'method',
      type: 'array',
      labels: { singular: 'Step', plural: 'Steps' },
      minRows: 1,
      fields: [
        {
          name: 'text',
          type: 'richText',
          editor: stepEditor,
          required: true,
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'notes',
      type: 'richText',
      admin: { description: "Chef's notes, service notes, storage." },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
  ],
}

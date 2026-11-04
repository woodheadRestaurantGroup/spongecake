import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Recipe, Site, User } from '@/payload-types'

import { actingAs, createRecipe, createSite, createUser, run } from '../helpers/fixtures'

let payload: Payload
let siteA: Site
let siteB: Site
let groupAdmin: User
let editorA: User
let viewerA: User
let viewerB: User
let siteAdminA: User
let publishedA: Recipe
let draftA: Recipe
let archivedA: Recipe
let publishedB: Recipe

const ids = (docs: { id: number }[]) => docs.map((d) => d.id).sort()

describe('tenant isolation', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    siteA = await createSite(payload, 'Alpha')
    siteB = await createSite(payload, 'Beta')

    groupAdmin = await createUser(payload, 'GroupAdmin', [], { isGroupAdmin: true })
    editorA = await createUser(payload, 'EditorA', [{ site: siteA.id, role: 'editor' }])
    viewerA = await createUser(payload, 'ViewerA', [{ site: siteA.id, role: 'viewer' }])
    viewerB = await createUser(payload, 'ViewerB', [{ site: siteB.id, role: 'viewer' }])
    siteAdminA = await createUser(payload, 'SiteAdminA', [{ site: siteA.id, role: 'siteAdmin' }])

    publishedA = await createRecipe(payload, {
      site: siteA.id,
      author: editorA.id,
      title: 'A published',
      status: 'published',
    })
    draftA = await createRecipe(payload, {
      site: siteA.id,
      author: editorA.id,
      title: 'A draft',
      status: 'draft',
    })
    archivedA = await createRecipe(payload, {
      site: siteA.id,
      author: editorA.id,
      title: 'A archived',
      status: 'published',
      archived: true,
    })
    publishedB = await createRecipe(payload, {
      site: siteB.id,
      author: groupAdmin.id,
      title: 'B published',
      status: 'published',
    })
  })

  afterAll(async () => {
    await payload.delete({
      collection: 'recipes',
      where: { site: { in: [siteA.id, siteB.id] } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'tags',
      where: { site: { in: [siteA.id, siteB.id] } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'users',
      where: { email: { like: `-${run}@example.test` } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'sites',
      where: { id: { in: [siteA.id, siteB.id] } },
      overrideAccess: true,
    })
    await payload.db.destroy?.()
  })

  describe('reading recipes', () => {
    it('a viewer sees only published, unarchived recipes at their site', async () => {
      const result = await payload.find({ collection: 'recipes', ...actingAs(viewerA), limit: 100 })
      expect(ids(result.docs)).toEqual([publishedA.id])
    })

    it('an editor sees drafts and archived recipes at their site but nothing elsewhere', async () => {
      const result = await payload.find({
        collection: 'recipes',
        ...actingAs(editorA),
        draft: true,
        limit: 100,
      })
      expect(ids(result.docs)).toEqual(ids([publishedA, draftA, archivedA]))
    })

    it('a viewer at another site sees only that site', async () => {
      const result = await payload.find({ collection: 'recipes', ...actingAs(viewerB), limit: 100 })
      expect(ids(result.docs)).toEqual([publishedB.id])
    })

    it('a group admin sees everything', async () => {
      const result = await payload.find({
        collection: 'recipes',
        ...actingAs(groupAdmin),
        draft: true,
        where: { site: { in: [siteA.id, siteB.id] } },
        limit: 100,
      })
      expect(ids(result.docs)).toEqual(ids([publishedA, draftA, archivedA, publishedB]))
    })

    it('fetching another site recipe by id is refused', async () => {
      await expect(
        payload.findByID({ collection: 'recipes', id: publishedB.id, ...actingAs(viewerA) }),
      ).rejects.toThrow()
    })
  })

  describe('writing recipes', () => {
    it('a viewer cannot edit', async () => {
      await expect(
        payload.update({
          collection: 'recipes',
          id: publishedA.id,
          data: { title: 'Nope' },
          ...actingAs(viewerA),
        }),
      ).rejects.toThrow()
    })

    it('an editor cannot edit another site recipe', async () => {
      await expect(
        payload.update({
          collection: 'recipes',
          id: publishedB.id,
          data: { title: 'Nope' },
          ...actingAs(editorA),
        }),
      ).rejects.toThrow()
    })

    it('an editor cannot create at another site', async () => {
      await expect(
        payload.create({
          collection: 'recipes',
          data: {
            title: 'Sneaky',
            site: siteB.id,
            author: editorA.id,
            yield: { amount: 1, label: 'portions' },
            ingredientSections: [{ ingredients: [{ quantity: 1, unit: 'g', item: 'x' }] }],
            method: [
              {
                text: {
                  root: {
                    type: 'root',
                    children: [],
                    direction: null,
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                },
              },
            ],
          },
          ...actingAs(editorA),
        }),
      ).rejects.toThrow()
    })

    it('a viewer cannot create at their own site', async () => {
      await expect(
        payload.create({
          collection: 'tags',
          data: { name: `Viewer tag ${run}`, site: siteA.id },
          ...actingAs(viewerA),
        }),
      ).rejects.toThrow()
    })

    it('an editor can edit at their own site', async () => {
      const updated = await payload.update({
        collection: 'recipes',
        id: publishedA.id,
        data: { title: 'A published (edited)' },
        ...actingAs(editorA),
      })
      expect(updated.title).toBe('A published (edited)')
    })

    it('an editor cannot delete, a site admin can', async () => {
      const victim = await createRecipe(payload, {
        site: siteA.id,
        author: editorA.id,
        title: 'Delete me',
        status: 'draft',
      })
      await expect(
        payload.delete({ collection: 'recipes', id: victim.id, ...actingAs(editorA) }),
      ).rejects.toThrow()
      await payload.delete({ collection: 'recipes', id: victim.id, ...actingAs(siteAdminA) })
    })

    it('only site admins change the author', async () => {
      const asEditor = await payload.update({
        collection: 'recipes',
        id: publishedA.id,
        data: { author: viewerA.id },
        ...actingAs(editorA),
      })
      expect(typeof asEditor.author === 'object' ? asEditor.author.id : asEditor.author).toBe(
        editorA.id,
      )

      const asAdmin = await payload.update({
        collection: 'recipes',
        id: publishedA.id,
        data: { author: viewerA.id },
        ...actingAs(siteAdminA),
      })
      expect(typeof asAdmin.author === 'object' ? asAdmin.author.id : asAdmin.author).toBe(
        viewerA.id,
      )
    })
  })

  describe('users', () => {
    it('a viewer sees only themselves', async () => {
      const result = await payload.find({ collection: 'users', ...actingAs(viewerA), limit: 100 })
      expect(ids(result.docs)).toEqual([viewerA.id])
    })

    it('a site admin sees members of their site and not others', async () => {
      const result = await payload.find({
        collection: 'users',
        ...actingAs(siteAdminA),
        limit: 100,
      })
      const found = ids(result.docs)
      expect(found).toContain(viewerA.id)
      expect(found).toContain(editorA.id)
      expect(found).not.toContain(viewerB.id)
      expect(found).not.toContain(groupAdmin.id)
    })

    it('a site admin cannot grant membership at another site', async () => {
      await expect(
        payload.create({
          collection: 'users',
          data: {
            name: 'Intruder',
            email: `intruder-${run}@example.test`,
            memberships: [{ site: siteB.id, role: 'viewer' }],
          },
          ...actingAs(siteAdminA),
        }),
      ).rejects.toThrow()
    })

    it('a site admin can add a member at their own site', async () => {
      const created = await payload.create({
        collection: 'users',
        data: {
          name: 'Newcomer',
          email: `newcomer-${run}@example.test`,
          memberships: [{ site: siteA.id, role: 'viewer' }],
        },
        ...actingAs(siteAdminA),
      })
      expect(
        created.memberships?.map((m) => (typeof m.site === 'object' ? m.site.id : m.site)),
      ).toEqual([siteA.id])
    })

    it('a site admin cannot remove a membership at another site', async () => {
      const multi = await createUser(payload, 'Multi', [
        { site: siteA.id, role: 'viewer' },
        { site: siteB.id, role: 'editor' },
      ])
      await expect(
        payload.update({
          collection: 'users',
          id: multi.id,
          data: { memberships: [{ site: siteA.id, role: 'editor' }] },
          ...actingAs(siteAdminA),
        }),
      ).rejects.toThrow()
      const updated = await payload.update({
        collection: 'users',
        id: multi.id,
        data: {
          memberships: [
            { site: siteA.id, role: 'editor' },
            { site: siteB.id, role: 'editor' },
          ],
        },
        ...actingAs(siteAdminA),
      })
      expect(
        updated.memberships?.find(
          (m) => (typeof m.site === 'object' ? m.site.id : m.site) === siteA.id,
        )?.role,
      ).toBe('editor')
    })

    it('a site admin cannot promote anyone to group admin', async () => {
      const updated = await payload.update({
        collection: 'users',
        id: viewerA.id,
        data: { isGroupAdmin: true },
        ...actingAs(siteAdminA),
      })
      expect(updated.isGroupAdmin).toBeFalsy()
    })
  })
})

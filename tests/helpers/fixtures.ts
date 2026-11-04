import type { Payload } from 'payload'

import type { Recipe, Site, User } from '@/payload-types'

export const run = Date.now().toString(36)

export const paragraph = (text: string): NonNullable<Recipe['method']>[number]['text'] => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: null,
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: null,
        textFormat: 0,
        children: [
          { type: 'text', text, version: 1, format: 0, mode: 'normal', style: '', detail: 0 },
        ],
      },
    ],
  },
})

/** Shape the local API expects when acting as a given user. */
export function actingAs(user: User) {
  return { user: { ...user, collection: 'users' as const }, overrideAccess: false as const }
}

export async function createSite(payload: Payload, name: string): Promise<Site> {
  const slug = `${name.toLowerCase()}-${run}`
  return payload.create({
    collection: 'sites',
    data: { name: `${name} ${run}`, slug, domains: [{ hostname: `${slug}.test` }] },
    overrideAccess: true,
  })
}

type MembershipInput = { site: number; role: 'viewer' | 'editor' | 'siteAdmin' }

export async function createUser(
  payload: Payload,
  name: string,
  memberships: MembershipInput[],
  extra: Partial<Pick<User, 'isGroupAdmin'>> = {},
): Promise<User> {
  return payload.create({
    collection: 'users',
    data: {
      name,
      email: `${name.toLowerCase()}-${run}@example.test`,
      memberships,
      ...extra,
    },
    overrideAccess: true,
  })
}

export async function createRecipe(
  payload: Payload,
  args: {
    site: number
    author: number
    title: string
    status: 'draft' | 'published'
    archived?: boolean
  },
): Promise<Recipe> {
  return payload.create({
    collection: 'recipes',
    draft: args.status === 'draft',
    data: {
      title: args.title,
      site: args.site,
      author: args.author,
      archived: args.archived ?? false,
      _status: args.status,
      yield: { amount: 4, label: 'portions' },
      ingredientSections: [{ ingredients: [{ quantity: 100, unit: 'g', item: 'Flour' }] }],
      method: [{ text: paragraph('Mix everything.') }],
    },
    overrideAccess: true,
  })
}

export async function deleteWhere(
  payload: Payload,
  collection: 'recipes' | 'tags' | 'users' | 'sites' | 'login-tokens',
  where: Record<string, unknown>,
) {
  await payload.delete({ collection, where: where as never, overrideAccess: true })
}

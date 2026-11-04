import type { Payload } from 'payload'
import { cache } from 'react'

import { avatarFor, type AvatarParams } from '@/components/Avatar'
import type { Media, Recipe, Tag, User } from '@/payload-types'

export type TagSummary = { id: number; name: string; slug: string }

export type Person = { name: string; avatar: AvatarParams }

export type RecipeSummary = {
  id: number
  slug: string
  title: string
  author: Person
  tags: TagSummary[]
  thumbnail: string | null
  /** Lowercased ingredient names for search. */
  ingredients: string[]
  updatedAt: string
}

export function idOf(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: number }).id
  return undefined
}

export function tagSummary(tag: number | Tag): TagSummary | null {
  if (typeof tag !== 'object') return null
  return { id: tag.id, name: tag.name, slug: tag.slug ?? '' }
}

export function person(user: number | User | null | undefined): Person {
  if (!user || typeof user !== 'object') return { name: 'Unknown', avatar: avatarFor('unknown') }
  return { name: user.name, avatar: avatarFor(user.email) }
}

export function imageUrl(
  media: number | Media | null | undefined,
  size: 'thumbnail' | 'card' | 'hero',
): string | null {
  if (!media || typeof media !== 'object') return null
  return media.sizes?.[size]?.url ?? media.url ?? null
}

export function toSummary(recipe: Recipe): RecipeSummary {
  const ingredients: string[] = []
  for (const section of recipe.ingredientSections ?? []) {
    for (const ing of section.ingredients ?? []) {
      if (ing.item) ingredients.push(ing.item.toLowerCase())
      if (ing.subRecipe && typeof ing.subRecipe === 'object')
        ingredients.push(ing.subRecipe.title.toLowerCase())
    }
  }
  return {
    id: recipe.id,
    slug: recipe.slug ?? String(recipe.id),
    title: recipe.title,
    author: person(recipe.author),
    tags: (recipe.tags ?? []).map(tagSummary).filter((t): t is TagSummary => t !== null),
    thumbnail: imageUrl(recipe.heroImage, 'thumbnail'),
    ingredients,
    updatedAt: recipe.updatedAt,
  }
}

/** Every published, unarchived recipe at a site, lightest useful shape, title order. Memoised per request. */
export const listPublishedRecipes = cache(
  async (payload: Payload, siteId: number): Promise<RecipeSummary[]> => {
    const result = await payload.find({
      collection: 'recipes',
      where: {
        and: [
          { site: { equals: siteId } },
          { _status: { equals: 'published' } },
          { archived: { not_equals: true } },
        ],
      },
      sort: 'title',
      limit: 500,
      depth: 1,
      overrideAccess: true,
    })
    return result.docs.map(toSummary)
  },
)

export const listTags = cache(async (payload: Payload, siteId: number): Promise<TagSummary[]> => {
  const result = await payload.find({
    collection: 'tags',
    where: { site: { equals: siteId } },
    sort: 'name',
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs.map((t) => ({ id: t.id, name: t.name, slug: t.slug ?? '' }))
})

/**
 * A single recipe by slug within a site. With `draft` the latest draft is
 * returned regardless of status, which is what live preview needs.
 */
export async function getRecipeBySlug(
  payload: Payload,
  siteId: number,
  slug: string,
  options: { draft?: boolean } = {},
): Promise<Recipe | null> {
  const draft = options.draft ?? false
  const result = await payload.find({
    collection: 'recipes',
    where: {
      and: [
        { site: { equals: siteId } },
        { slug: { equals: slug } },
        ...(draft
          ? []
          : [{ _status: { equals: 'published' } }, { archived: { not_equals: true } }]),
      ],
    },
    draft,
    limit: 1,
    depth: 2,
    overrideAccess: true,
  })
  return result.docs[0] ?? null
}

export type HistoryEntry = { editor: Person; when: string; at: string; note: string | null }

/** Saved versions of a recipe, newest first, with who saved them. */
export async function listRecipeHistory(
  payload: Payload,
  recipe: Recipe,
  limit = 10,
): Promise<HistoryEntry[]> {
  const versions = await payload.findVersions({
    collection: 'recipes',
    where: { parent: { equals: recipe.id } },
    sort: '-updatedAt',
    limit,
    depth: 1,
    overrideAccess: true,
  })
  const fallback = person(recipe.author)
  return versions.docs.map((v) => {
    const editor = v.version.lastEditedBy
    return {
      editor: editor && typeof editor === 'object' ? person(editor) : fallback,
      at: v.updatedAt,
      when: relativeTime(v.updatedAt),
      note: v.version.changeNote ?? null,
    }
  })
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

export function favouriteIds(user: User | null | undefined): number[] {
  return (user?.favourites ?? []).map(idOf).filter((id): id is number => id !== undefined)
}

export function siteInitial(name: string): string {
  return (name.replace(/^the\s+/i, '')[0] || 'S').toUpperCase()
}

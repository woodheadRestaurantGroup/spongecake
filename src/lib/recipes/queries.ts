import type { Payload } from 'payload'

import type { Media, Recipe, Tag, User } from '@/payload-types'

export type TagSummary = { id: number; name: string; slug: string }

export type RecipeSummary = {
  id: number
  slug: string
  title: string
  author: { name: string; avatarSeed: string }
  tags: TagSummary[]
  thumbnail: string | null
  /** Lowercased ingredient names for search. */
  ingredients: string[]
  updatedAt: string
}

function idOf(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: number }).id
  return undefined
}

export function tagSummary(tag: number | Tag): TagSummary | null {
  if (typeof tag !== 'object') return null
  return { id: tag.id, name: tag.name, slug: tag.slug ?? '' }
}

export function authorSummary(author: number | User): RecipeSummary['author'] {
  if (typeof author !== 'object') return { name: 'Unknown', avatarSeed: 'unknown' }
  return { name: author.name, avatarSeed: author.avatarSeed ?? String(author.id) }
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
    author: authorSummary(recipe.author),
    tags: (recipe.tags ?? []).map(tagSummary).filter((t): t is TagSummary => t !== null),
    thumbnail: imageUrl(recipe.heroImage, 'thumbnail'),
    ingredients,
    updatedAt: recipe.updatedAt,
  }
}

/** Every published, unarchived recipe at a site, lightest useful shape, title order. */
export async function listPublishedRecipes(
  payload: Payload,
  siteId: number,
): Promise<RecipeSummary[]> {
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
}

export async function listTags(payload: Payload, siteId: number): Promise<TagSummary[]> {
  const result = await payload.find({
    collection: 'tags',
    where: { site: { equals: siteId } },
    sort: 'name',
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs.map((t) => ({ id: t.id, name: t.name, slug: t.slug ?? '' }))
}

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

export { idOf }

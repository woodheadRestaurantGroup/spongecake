'use server'

import { revalidatePath } from 'next/cache'

import { getRequestContext } from '@/lib/request'

function idOf(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: number }).id
  return undefined
}

/** Adds or removes a recipe from the signed-in user's favourites. Returns the new state. */
export async function toggleFavouriteAction(recipeId: number): Promise<{ favourite: boolean }> {
  const { payload, user, site, role } = await getRequestContext()
  if (!user || !site || !role) throw new Error('Not signed in')

  const recipe = await payload.findByID({
    collection: 'recipes',
    id: recipeId,
    depth: 0,
    overrideAccess: true,
  })
  if (idOf(recipe.site) !== site.id) throw new Error('Recipe is not at this site')

  const current = (user.favourites ?? []).map(idOf).filter((id): id is number => id !== undefined)
  const favourite = !current.includes(recipeId)
  const next = favourite ? [...current, recipeId] : current.filter((id) => id !== recipeId)

  await payload.update({
    collection: 'users',
    id: user.id,
    data: { favourites: next },
    overrideAccess: true,
  })
  revalidatePath('/')
  return { favourite }
}

export type SuggestionState = { ok?: boolean; error?: string }

/** Files a free-text suggestion against a recipe and emails the site's editors. */
export async function submitSuggestionAction(
  _prev: SuggestionState,
  formData: FormData,
): Promise<SuggestionState> {
  const { payload, user, site, role } = await getRequestContext()
  if (!user || !site || !role) return { error: 'You need to be signed in.' }

  const recipeId = Number(formData.get('recipeId'))
  const body = String(formData.get('body') ?? '').trim()
  if (!recipeId) return { error: 'Something went wrong. Reload and try again.' }
  if (body.length < 3) return { error: 'Write a little more so the editors know what to change.' }
  if (body.length > 2000) return { error: 'Keep it under 2,000 characters.' }

  const recipe = await payload.findByID({
    collection: 'recipes',
    id: recipeId,
    depth: 0,
    overrideAccess: true,
  })
  if (idOf(recipe.site) !== site.id) return { error: 'Recipe is not at this site.' }

  await payload.create({
    collection: 'suggestions',
    data: { recipe: recipeId, site: site.id, submittedBy: user.id, body, status: 'open' },
    user: { ...user, collection: 'users' },
    overrideAccess: false,
  })
  return { ok: true }
}

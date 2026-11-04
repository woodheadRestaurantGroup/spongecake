import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { LivePreview } from '@/components/recipe/LivePreview'
import { RecipeScreen } from '@/components/recipe/RecipeScreen'
import { RecordRecent } from '@/components/recipe/RecordRecent'
import { StepText } from '@/components/recipe/StepText'
import type { RecipeView } from '@/components/recipe/types'
import {
  favouriteIds,
  getRecipeBySlug,
  imageUrl,
  listRecipeHistory,
  person,
  relativeTime,
  tagSummary,
} from '@/lib/recipes/queries'
import { parseYieldParam } from '@/lib/recipes/scaling'
import { yieldStep } from '@/lib/recipes/yieldStep'
import { toSections } from '@/lib/recipes/view'
import { getRequestContext } from '@/lib/request'

type Params = Promise<{ slug: string }>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const { payload, site } = await getRequestContext()
  if (!site) return {}
  const recipe = await getRecipeBySlug(payload, site.id, slug)
  return { title: recipe?.title ?? 'Recipe' }
}

export default async function RecipePage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const ctx = await getRequestContext()
  if (!ctx.site || !ctx.user) return null

  const canEdit = ctx.role === 'editor' || ctx.role === 'siteAdmin'
  const preview = canEdit && query.preview === 'true'

  const recipe = await getRecipeBySlug(ctx.payload, ctx.site.id, slug, { draft: preview })
  if (!recipe) notFound()

  const history = await listRecipeHistory(ctx.payload, recipe)
  const from = typeof query.from === 'string' ? query.from.trim() : ''
  const yieldQuery =
    typeof query.yield === 'string' ? `?yield=${encodeURIComponent(query.yield)}` : ''

  const view: RecipeView = {
    id: recipe.id,
    slug: recipe.slug ?? slug,
    title: recipe.title,
    draft: recipe._status === 'draft',
    author: person(recipe.author),
    updated: `Updated ${relativeTime(recipe.updatedAt)}`,
    tags: (recipe.tags ?? [])
      .map(tagSummary)
      .filter((t) => t !== null)
      .map((t) => t.name),
    heroUrl: imageUrl(recipe.heroImage, 'hero'),
    yield: {
      amount: recipe.yield.amount,
      label: recipe.yield.label,
      step: yieldStep(recipe.yield.label, recipe.yield.amount),
    },
    sections: toSections(recipe),
    steps: (recipe.method ?? []).map((step, i) => ({
      id: step.id ?? String(i),
      node: <StepText data={step.text} />,
      imageUrl: imageUrl(step.image, 'card'),
    })),
    notes: recipe.notes ? <StepText data={recipe.notes} /> : null,
    history: history.map((h) => ({
      name: h.editor.name,
      avatar: h.editor.avatar,
      when: h.when,
      note: h.note,
    })),
    isFavourite: favouriteIds(ctx.user).includes(recipe.id),
    canEdit,
    adminUrl: `/admin/collections/recipes/${recipe.id}`,
    printUrl: `/recipes/${recipe.slug ?? slug}/print${yieldQuery}`,
    backLabel: from ? from.split(' ')[0] : 'Recipes',
    backHref: '/',
    initialYield: parseYieldParam(query.yield),
  }

  return (
    <>
      {preview && <LivePreview serverURL={ctx.origin} />}
      {!preview && <RecordRecent siteSlug={ctx.site.slug} slug={view.slug} />}
      <RecipeScreen recipe={view} />
    </>
  )
}

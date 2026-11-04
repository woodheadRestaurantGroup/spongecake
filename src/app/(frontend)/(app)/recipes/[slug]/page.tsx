import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { Avatar } from '@/components/Avatar'
import { LivePreview } from '@/components/recipe/LivePreview'
import { RecordRecent } from '@/components/recipe/RecordRecent'
import { ScaledIngredients, type IngredientSection } from '@/components/recipe/ScaledIngredients'
import { StepText } from '@/components/recipe/StepText'
import { authorSummary, getRecipeBySlug, imageUrl, tagSummary } from '@/lib/recipes/queries'
import { parseYieldParam } from '@/lib/recipes/scaling'
import { getRequestContext } from '@/lib/request'
import type { Recipe } from '@/payload-types'

type Params = Promise<{ slug: string }>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const { payload, site } = await getRequestContext()
  if (!site) return {}
  const recipe = await getRecipeBySlug(payload, site.id, slug)
  return { title: recipe?.title ?? 'Recipe' }
}

function toSections(recipe: Recipe): IngredientSection[] {
  return (recipe.ingredientSections ?? []).map((section, i) => ({
    id: section.id ?? String(i),
    title: section.title ?? null,
    ingredients: (section.ingredients ?? []).map((ing, j) => ({
      id: ing.id ?? `${i}-${j}`,
      quantity: ing.quantity ?? null,
      unit: ing.unit ?? null,
      unitLabel: ing.unitLabel ?? null,
      item: ing.item ?? null,
      note: ing.note ?? null,
      scales: ing.scales !== false,
      subRecipe:
        ing.subRecipe && typeof ing.subRecipe === 'object'
          ? { title: ing.subRecipe.title, slug: ing.subRecipe.slug ?? String(ing.subRecipe.id) }
          : null,
    })),
  }))
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years === 1 ? '' : 's'} ago`
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
  if (!ctx.site) return null

  const canEdit = ctx.role === 'editor' || ctx.role === 'siteAdmin'
  const preview = canEdit && query.preview === 'true'

  const recipe = await getRecipeBySlug(ctx.payload, ctx.site.id, slug, { draft: preview })
  if (!recipe) notFound()

  const author = authorSummary(recipe.author)
  const hero = imageUrl(recipe.heroImage, 'hero')
  const tags = (recipe.tags ?? []).map(tagSummary).filter((t) => t !== null)
  const baseYield = recipe.yield.amount
  const initialYield = parseYieldParam(query.yield)

  return (
    <article className="space-y-8">
      {preview && <LivePreview serverURL={ctx.origin} />}
      {!preview && <RecordRecent siteSlug={ctx.site.slug} slug={recipe.slug ?? slug} />}

      {hero && (
        <div className="-mx-4 -mt-4 aspect-[4/3] overflow-hidden bg-stone-200 sm:mx-0 sm:mt-0 sm:aspect-[2/1] sm:rounded-2xl dark:bg-stone-800">
          <Image
            src={hero}
            alt={typeof recipe.heroImage === 'object' ? (recipe.heroImage?.alt ?? '') : ''}
            width={1600}
            height={900}
            priority
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <header>
        {recipe._status === 'draft' && (
          <p className="mb-2 inline-block rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
            Draft
          </p>
        )}
        <h1 className="text-3xl font-semibold leading-tight tracking-tight">{recipe.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone-600 dark:text-stone-300">
          <span className="flex items-center gap-2">
            <Avatar seed={author.avatarSeed} name={author.name} size={24} />
            <span className="font-medium text-stone-800 dark:text-stone-100">{author.name}</span>
          </span>
          <span>Updated {relativeTime(recipe.updatedAt)}</span>
        </div>
        {tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <li
                key={t.id}
                className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-700 dark:text-stone-200"
              >
                {t.name}
              </li>
            ))}
          </ul>
        )}
      </header>

      <ScaledIngredients
        sections={toSections(recipe)}
        baseYield={baseYield}
        yieldLabel={recipe.yield.label}
        initialYield={initialYield}
      />

      <section aria-labelledby="method-heading">
        <h2 id="method-heading" className="mb-3 text-xl font-semibold">
          Method
        </h2>
        <ol className="space-y-5">
          {(recipe.method ?? []).map((step, i) => {
            const stepImage = imageUrl(step.image, 'card')
            return (
              <li key={step.id ?? i} className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 text-lg leading-relaxed">
                  <StepText data={step.text} className="prose-steps" />
                  {stepImage && (
                    <Image
                      src={stepImage}
                      alt=""
                      width={800}
                      height={600}
                      className="mt-3 w-full rounded-xl object-cover"
                    />
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {recipe.notes && (
        <section
          aria-labelledby="notes-heading"
          className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-stone-800 dark:ring-stone-700"
        >
          <h2 id="notes-heading" className="mb-2 text-base font-semibold">
            Notes
          </h2>
          <StepText data={recipe.notes} className="prose-steps text-base leading-relaxed" />
        </section>
      )}

      {canEdit && (
        <footer className="border-t border-stone-200 pt-4 dark:border-stone-700">
          <Link
            href={`/admin/collections/recipes/${recipe.id}`}
            prefetch={false}
            className="text-sm font-medium text-accent"
          >
            Edit in admin
          </Link>
        </footer>
      )}
    </article>
  )
}

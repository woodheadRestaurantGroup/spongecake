'use client'

import React, { useMemo } from 'react'

import { TransitionLink } from '@/components/nav/ViewTransitions'
import { SectionLabel } from '@/components/ui'
import { useLocalStorageValue } from '@/lib/localStorage'
import { parseRecent, recentKey, viewedLabel } from '@/lib/recent'
import type { RecipeSummary } from '@/lib/recipes/queries'

/** The main pane of the desktop home: the sidebar does the browsing, this shows shortcuts. */
export function DesktopHome({
  siteSlug,
  recipes,
  favouriteIds,
}: {
  siteSlug: string
  recipes: RecipeSummary[]
  favouriteIds: number[]
}) {
  const recentRaw = useLocalStorageValue(recentKey(siteSlug))
  const recent = useMemo(() => {
    const bySlug = new Map(recipes.map((r) => [r.slug, r]))
    return parseRecent(recentRaw)
      .map((e) => ({ at: e.at, recipe: bySlug.get(e.slug) }))
      .filter((x): x is { at: string; recipe: RecipeSummary } => Boolean(x.recipe))
      .slice(0, 6)
  }, [recentRaw, recipes])
  const favourites = recipes.filter((r) => favouriteIds.includes(r.id))

  const card = (key: string, title: string, sub: string, href: string) => (
    <TransitionLink
      key={key}
      href={href}
      className="flex min-h-[96px] flex-col justify-between gap-2.5 rounded-[14px] border border-line bg-surface p-3.5 text-left hover:bg-surface-2"
    >
      <span className="line-clamp-2 text-[16px] font-semibold leading-[1.25]">{title}</span>
      <span className="text-[13px] text-ink-2">{sub}</span>
    </TransitionLink>
  )

  return (
    <div className="hidden lg:block">
      <h2 className="text-[28px] font-semibold tracking-[-0.01em]">Recipes</h2>
      <p className="mt-2 text-[16px] text-ink-2">
        Pick a recipe from the list, or search with{' '}
        <kbd className="rounded-[6px] border border-line px-1.5 text-[12px]">/</kbd>.
      </p>
      {recent.length > 0 && (
        <section className="mt-8">
          <SectionLabel className="pb-2.5">Recently viewed</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            {recent.map((r) =>
              card(r.recipe.slug, r.recipe.title, viewedLabel(r.at), `/recipes/${r.recipe.slug}`),
            )}
          </div>
        </section>
      )}
      {favourites.length > 0 && (
        <section className="mt-8">
          <SectionLabel className="pb-2.5">Favourites</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            {favourites.map((r) =>
              card(
                r.slug,
                r.title,
                r.tags.map((t) => t.name).join(', ') || r.author.name,
                `/recipes/${r.slug}`,
              ),
            )}
          </div>
        </section>
      )}
    </div>
  )
}

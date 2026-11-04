'use client'

import React, { useDeferredValue, useMemo, useState } from 'react'

import { useLocalStorageValue } from '@/lib/localStorage'

import type { RecipeSummary, TagSummary } from '@/lib/recipes/queries'

import { RecipeCard } from './RecipeCard'

type Props = {
  siteSlug: string
  recipes: RecipeSummary[]
  tags: TagSummary[]
  /** Tag ids to show as home page sections, in order. */
  homeTagIds: number[]
}

export function recentKey(siteSlug: string) {
  return `recent:${siteSlug}`
}

function parseRecent(raw: string | null): string[] {
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

function matches(recipe: RecipeSummary, terms: string[]): boolean {
  if (terms.length === 0) return true
  const haystack = [
    recipe.title.toLowerCase(),
    recipe.author.name.toLowerCase(),
    ...recipe.tags.map((t) => t.name.toLowerCase()),
    ...recipe.ingredients,
  ].join(' ')
  return terms.every((t) => haystack.includes(t))
}

export function RecipeBrowser({ siteSlug, recipes, tags, homeTagIds }: Props) {
  const [query, setQuery] = useState('')
  const [tagId, setTagId] = useState<number | null>(null)
  const recentRaw = useLocalStorageValue(recentKey(siteSlug))
  const recent = useMemo(() => parseRecent(recentRaw), [recentRaw])
  const deferredQuery = useDeferredValue(query)

  const terms = deferredQuery.toLowerCase().split(/\s+/).filter(Boolean)
  const searching = terms.length > 0 || tagId !== null

  const results = useMemo(() => {
    if (!searching) return []
    return recipes.filter(
      (r) => matches(r, terms) && (tagId === null || r.tags.some((t) => t.id === tagId)),
    )
  }, [recipes, searching, terms, tagId])

  const sections = useMemo(() => {
    const byId = new Map(tags.map((t) => [t.id, t]))
    const placed = new Set<number>()
    const out: { title: string; recipes: RecipeSummary[] }[] = []
    for (const id of homeTagIds) {
      const tag = byId.get(id)
      if (!tag) continue
      const members = recipes.filter((r) => r.tags.some((t) => t.id === id))
      if (members.length === 0) continue
      members.forEach((r) => placed.add(r.id))
      out.push({ title: tag.name, recipes: members })
    }
    const rest = recipes.filter((r) => !placed.has(r.id))
    if (rest.length > 0)
      out.push({ title: out.length > 0 ? 'Everything else' : 'All recipes', recipes: rest })
    return out
  }, [recipes, tags, homeTagIds])

  const recentRecipes = useMemo(
    () =>
      recent
        .map((slug) => recipes.find((r) => r.slug === slug))
        .filter((r): r is RecipeSummary => Boolean(r))
        .slice(0, 6),
    [recent, recipes],
  )

  return (
    <div className="space-y-6">
      <div className="sticky top-14 z-10 -mx-4 bg-stone-50/95 px-4 py-3 backdrop-blur dark:bg-stone-900/95">
        <label className="relative block">
          <span className="sr-only">Search recipes</span>
          <svg
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.08 3.08a.75.75 0 11-1.06 1.06l-3.08-3.08A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes, ingredients, chefs"
            autoComplete="off"
            autoCorrect="off"
            enterKeyHint="search"
            className="h-11 w-full rounded-xl border border-stone-300 bg-white pl-10 pr-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-stone-700 dark:bg-stone-800"
          />
        </label>
        {tags.length > 0 && (
          <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {tags.map((t) => {
              const active = tagId === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTagId(active ? null : t.id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                    active
                      ? 'border-accent bg-accent text-white'
                      : 'border-stone-300 bg-white text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200'
                  }`}
                >
                  {t.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {searching ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {results.length === 0
              ? 'No recipes match'
              : `${results.length} recipe${results.length === 1 ? '' : 's'}`}
          </h2>
          <ul className="space-y-2">
            {results.map((r) => (
              <li key={r.id}>
                <RecipeCard recipe={r} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          {recentRecipes.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                Recently viewed
              </h2>
              <ul className="space-y-2">
                {recentRecipes.map((r) => (
                  <li key={r.id}>
                    <RecipeCard recipe={r} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                {s.title}
              </h2>
              <ul className="space-y-2">
                {s.recipes.map((r) => (
                  <li key={r.id}>
                    <RecipeCard recipe={r} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {recipes.length === 0 && (
            <p className="py-12 text-center text-stone-500 dark:text-stone-400">
              No recipes published yet.
            </p>
          )}
        </>
      )}
    </div>
  )
}

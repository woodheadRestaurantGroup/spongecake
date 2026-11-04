'use client'

import Link from 'next/link'
import React, { useDeferredValue, useMemo, useState } from 'react'

import { Avatar, type AvatarParams } from '@/components/Avatar'
import { TransitionLink } from '@/components/nav/ViewTransitions'
import { Button, EmptyState, GroupedList, SectionLabel, cx } from '@/components/ui'
import { ChevronRight, ClearCircle, Search } from '@/components/ui/icons'
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator'
import { PrefetchFavourites } from '@/components/pwa/PrefetchFavourites'
import { useLocalStorageValue } from '@/lib/localStorage'
import { parseRecent, recentKey, viewedLabel } from '@/lib/recent'
import type { RecipeSummary, TagSummary } from '@/lib/recipes/queries'

export type HomeProps = {
  site: { name: string; initial: string; slug: string }
  me: { avatar: AvatarParams }
  isEditor: boolean
  recipes: RecipeSummary[]
  tags: TagSummary[]
  homeTagIds: number[]
  favouriteIds: number[]
}

type Hit = { recipe: RecipeSummary; match: string | null }

function search(recipes: RecipeSummary[], q: string, tagId: number | null): Hit[] {
  const hits: Hit[] = []
  for (const r of recipes) {
    if (tagId !== null && !r.tags.some((t) => t.id === tagId)) continue
    if (!q) {
      hits.push({ recipe: r, match: null })
      continue
    }
    const direct =
      r.title.toLowerCase().includes(q) ||
      r.tags.some((t) => t.name.toLowerCase().includes(q)) ||
      r.author.name.toLowerCase().includes(q)
    if (direct) {
      hits.push({ recipe: r, match: null })
      continue
    }
    const ing = r.ingredients.find((i) => i.includes(q))
    if (ing) hits.push({ recipe: r, match: ing })
  }
  return hits
}

export function RecipeRow({
  recipe,
  match,
  from,
}: {
  recipe: RecipeSummary
  match?: string | null
  from?: string
}) {
  const meta = [recipe.author.name, recipe.tags.map((t) => t.name).join(', ')]
    .filter(Boolean)
    .join(' · ')
  const href = `/recipes/${recipe.slug}${from ? `?from=${encodeURIComponent(from)}` : ''}`
  return (
    <TransitionLink
      href={href}
      className="flex min-h-[72px] w-full items-center gap-3 py-3 pl-3.5 pr-2 text-left active:bg-surface-2"
    >
      {recipe.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipe.thumbnail}
          alt=""
          width={52}
          height={52}
          className="h-[52px] w-[52px] shrink-0 rounded-[10px] object-cover"
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold leading-[1.3]">{recipe.title}</span>
        <span className="mt-[5px] flex items-center gap-1.5 text-[14px] text-ink-2">
          <Avatar params={recipe.author.avatar} size={18} />
          <span className="truncate">{meta}</span>
        </span>
        {match && (
          <span className="mt-1 block text-[14px] text-ink-2">
            Contains <span className="font-semibold text-ink">{match}</span>
          </span>
        )}
      </span>
      <ChevronRight className="shrink-0 text-ink-3" />
    </TransitionLink>
  )
}

function Rail({
  label,
  items,
}: {
  label: string
  items: { key: string; title: string; sub: string; href: string }[]
}) {
  if (items.length === 0) return null
  return (
    <section>
      <SectionLabel className="px-4 pb-2.5 pt-[18px]">{label}</SectionLabel>
      <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4">
        {items.map((it) => (
          <TransitionLink
            key={it.key}
            href={it.href}
            className="flex min-h-[96px] w-[164px] shrink-0 flex-col justify-between gap-2.5 rounded-[14px] border border-line bg-surface p-3.5 text-left transition-transform duration-[90ms] active:scale-[0.97]"
          >
            <span className="line-clamp-2 text-[16px] font-semibold leading-[1.25]">
              {it.title}
            </span>
            <span className="text-[13px] text-ink-2">{it.sub}</span>
          </TransitionLink>
        ))}
      </div>
    </section>
  )
}

export function HomeScreen({
  site,
  me,
  isEditor,
  recipes,
  tags,
  homeTagIds,
  favouriteIds,
}: HomeProps) {
  const [query, setQuery] = useState('')
  const [tagId, setTagId] = useState<number | null>(null)
  const deferred = useDeferredValue(query)
  const q = deferred.trim().toLowerCase()
  const filtering = q.length > 0 || tagId !== null

  const recentRaw = useLocalStorageValue(recentKey(site.slug))
  const recent = useMemo(() => {
    const bySlug = new Map(recipes.map((r) => [r.slug, r]))
    return parseRecent(recentRaw)
      .map((e) => ({ entry: e, recipe: bySlug.get(e.slug) }))
      .filter((x): x is { entry: { slug: string; at: string }; recipe: RecipeSummary } =>
        Boolean(x.recipe),
      )
      .slice(0, 10)
  }, [recentRaw, recipes])

  const favourites = useMemo(
    () => recipes.filter((r) => favouriteIds.includes(r.id)),
    [recipes, favouriteIds],
  )

  const hits = useMemo(
    () => (filtering ? search(recipes, q, tagId) : []),
    [filtering, recipes, q, tagId],
  )

  const sections = useMemo(() => {
    const byId = new Map(tags.map((t) => [t.id, t]))
    const placed = new Set<number>()
    const out: { title: string; recipes: RecipeSummary[] }[] = []
    for (const id of homeTagIds) {
      const tag = byId.get(id)
      if (!tag) continue
      const members = recipes.filter((r) => !placed.has(r.id) && r.tags.some((t) => t.id === id))
      if (members.length === 0) continue
      members.forEach((r) => placed.add(r.id))
      out.push({ title: tag.name, recipes: members })
    }
    const rest = recipes.filter((r) => !placed.has(r.id))
    if (rest.length > 0)
      out.push({ title: out.length > 0 ? 'Everything else' : 'All recipes', recipes: rest })
    return out
  }, [recipes, tags, homeTagIds])

  const clearAll = () => {
    setQuery('')
    setTagId(null)
  }

  return (
    <div className="lg:hidden">
      <div
        className="sticky top-0 z-20 bg-bg pb-2.5"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex h-12 items-center gap-3 px-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent text-[17px] font-semibold text-on-accent">
            {site.initial}
          </span>
          <span className="min-w-0 flex-1 truncate text-[18px] font-semibold">{site.name}</span>
          {isEditor && (
            <Link
              href="/admin"
              prefetch={false}
              className="flex h-8 items-center rounded-full border-[1.5px] border-line px-3 text-[14px] font-semibold"
            >
              Admin
            </Link>
          )}
          <TransitionLink
            href="/profile"
            aria-label="Profile"
            className="-mr-1 flex h-11 w-11 shrink-0 items-center justify-center"
          >
            <Avatar params={me.avatar} size={34} />
          </TransitionLink>
        </div>
        <div className="px-4 pt-2">
          <div className="relative flex h-12 items-center rounded-[14px] border-[1.5px] border-line bg-surface">
            <Search className="ml-3.5 mr-2.5 shrink-0 text-ink-2" />
            <input
              id="home-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Recipes, ingredients, chefs"
              autoComplete="off"
              autoCorrect="off"
              enterKeyHint="search"
              className="h-full min-w-0 flex-1 bg-transparent text-[17px] outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear"
                className="flex h-11 w-11 shrink-0 items-center justify-center"
              >
                <ClearCircle />
              </button>
            )}
          </div>
        </div>
        {tags.length > 0 && (
          <div className="no-scrollbar chip-fade flex gap-2 overflow-x-auto px-4 pt-2.5">
            {tags.map((t) => {
              const active = tagId === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTagId(active ? null : t.id)}
                  className={cx(
                    'h-10 shrink-0 rounded-full border-[1.5px] px-4 text-[15px] font-semibold transition-[background-color,border-color] duration-[120ms] active:scale-[0.96]',
                    active
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line bg-surface text-ink',
                  )}
                >
                  {t.name}
                </button>
              )
            })}
            <span className="w-6 shrink-0" aria-hidden />
          </div>
        )}
        <OfflineIndicator className="flex justify-center px-4 pt-2.5" />
      </div>
      <PrefetchFavourites slugs={favourites.map((r) => r.slug)} />

      {filtering ? (
        <>
          <SectionLabel className="px-4 pb-2.5 pt-[18px]">
            {hits.length === 1 ? '1 recipe' : `${hits.length} recipes`}
          </SectionLabel>
          {hits.length > 0 ? (
            <GroupedList className="mx-4">
              {hits.map((h) => (
                <RecipeRow key={h.recipe.id} recipe={h.recipe} match={h.match} />
              ))}
            </GroupedList>
          ) : (
            <EmptyState
              title={q ? `Nothing for “${deferred.trim()}”` : 'Nothing with that tag'}
              body="Try an ingredient, a tag or a chef’s name."
              action={
                <Button variant="soft" size="sm" onClick={clearAll}>
                  Clear search
                </Button>
              }
            />
          )}
        </>
      ) : (
        <>
          <Rail
            label="Recently viewed"
            items={recent.map(({ entry, recipe }) => ({
              key: recipe.slug,
              title: recipe.title,
              sub: viewedLabel(entry.at),
              href: `/recipes/${recipe.slug}`,
            }))}
          />
          <Rail
            label="Favourites"
            items={favourites.map((r) => ({
              key: r.slug,
              title: r.title,
              sub: r.tags.map((t) => t.name).join(', ') || r.author.name,
              href: `/recipes/${r.slug}`,
            }))}
          />
          {sections.map((s) => (
            <section key={s.title}>
              <SectionLabel className="px-4 pb-2.5 pt-[26px]" count={s.recipes.length}>
                {s.title}
              </SectionLabel>
              <GroupedList className="mx-4">
                {s.recipes.map((r) => (
                  <RecipeRow key={r.id} recipe={r} />
                ))}
              </GroupedList>
            </section>
          ))}
          {recipes.length === 0 && (
            <EmptyState
              title="No recipes yet"
              body="Editors can add recipes in Admin."
              action={
                isEditor ? (
                  <Link
                    href="/admin/collections/recipes"
                    prefetch={false}
                    className="inline-flex h-11 items-center rounded-[12px] border-[1.5px] border-line px-4 text-[15px] font-semibold"
                  >
                    Open Admin
                  </Link>
                ) : undefined
              }
            />
          )}
        </>
      )}
      <div className="h-12" />
    </div>
  )
}

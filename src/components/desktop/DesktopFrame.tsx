'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { Avatar, type AvatarParams } from '@/components/Avatar'
import { TransitionLink } from '@/components/nav/ViewTransitions'
import { cx } from '@/components/ui'
import { Search } from '@/components/ui/icons'
import type { RecipeSummary, TagSummary } from '@/lib/recipes/queries'

type Props = {
  site: { name: string; initial: string }
  me: { avatar: AvatarParams }
  isEditor: boolean
  recipes: RecipeSummary[]
  tags: TagSummary[]
  homeTagIds: number[]
  children: React.ReactNode
}

/**
 * At 1024px and up: top bar, a sidebar listing every recipe, and the page in
 * the main pane. Below that it renders the children alone.
 */
export function DesktopFrame({ site, me, isEditor, recipes, tags, homeTagIds, children }: Props) {
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [tagId, setTagId] = useState<number | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const q = query.trim().toLowerCase()
  const groups = useMemo(() => {
    const visible = recipes.filter((r) => {
      if (tagId !== null && !r.tags.some((t) => t.id === tagId)) return false
      if (!q) return true
      return (
        r.title.toLowerCase().includes(q) ||
        r.tags.some((t) => t.name.toLowerCase().includes(q)) ||
        r.author.name.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.includes(q))
      )
    })
    const byId = new Map(tags.map((t) => [t.id, t]))
    const placed = new Set<number>()
    const out: { title: string; rows: RecipeSummary[] }[] = []
    for (const id of homeTagIds) {
      const tag = byId.get(id)
      if (!tag) continue
      const rows = visible.filter((r) => !placed.has(r.id) && r.tags.some((t) => t.id === id))
      if (!rows.length) continue
      rows.forEach((r) => placed.add(r.id))
      out.push({ title: tag.name, rows })
    }
    const rest = visible.filter((r) => !placed.has(r.id))
    if (rest.length) out.push({ title: out.length ? 'Everything else' : 'All recipes', rows: rest })
    return out
  }, [recipes, tags, homeTagIds, q, tagId])

  const sidebar = (
    <aside
      className="hidden overflow-y-auto border-r border-line px-3 pb-8 pt-4 lg:block"
      style={{ scrollbarWidth: 'thin' }}
    >
      <div className="flex flex-wrap gap-1.5 px-1 pb-2">
        {tags.map((t) => {
          const active = tagId === t.id
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={active}
              onClick={() => setTagId(active ? null : t.id)}
              className={cx(
                'h-[34px] rounded-full border-[1.5px] px-3 text-[14px] font-semibold transition-colors duration-[120ms]',
                active
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-surface text-ink hover:bg-surface-2',
              )}
            >
              {t.name}
            </button>
          )
        })}
      </div>
      {groups.map((g) => (
        <div key={g.title}>
          <div className="flex justify-between px-2 pb-1.5 pt-[18px] text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-2">
            <span>{g.title}</span>
            <span className="font-normal tracking-normal">{g.rows.length}</span>
          </div>
          {g.rows.map((r) => {
            const selected = pathname === `/recipes/${r.slug}`
            return (
              <TransitionLink
                key={r.id}
                href={`/recipes/${r.slug}`}
                className={cx(
                  'flex w-full items-center gap-2.5 rounded-[10px] px-2 py-2.5 text-left transition-colors duration-100 hover:bg-surface-2',
                  selected && 'bg-surface-2',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold leading-[1.3]">{r.title}</span>
                  <span className="mt-[3px] flex items-center gap-1.5 text-[13px] text-ink-2">
                    <Avatar params={r.author.avatar} size={16} />
                    <span className="truncate">
                      {[r.author.name, r.tags.map((t) => t.name).join(', ')]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </span>
              </TransitionLink>
            )
          })}
        </div>
      ))}
      {groups.length === 0 && (
        <div className="px-4 py-10 text-center">
          <div className="text-[17px] font-semibold">Nothing matches</div>
          <div className="mt-1.5 text-[14px] text-ink-2">
            Try an ingredient, a tag or a chef’s name.
          </div>
        </div>
      )}
    </aside>
  )

  return (
    <div className="lg:flex lg:h-dvh lg:flex-col">
      <header className="hidden h-16 shrink-0 items-center gap-4 border-b border-line bg-bg px-6 lg:flex">
        <TransitionLink href="/" className="flex items-center gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent text-[17px] font-semibold text-on-accent">
            {site.initial}
          </span>
          <span className="w-[260px] truncate text-[18px] font-semibold">{site.name}</span>
        </TransitionLink>
        <div className="flex flex-1 justify-center">
          <div className="flex h-11 w-full max-w-[520px] items-center rounded-[12px] border-[1.5px] border-line bg-surface">
            <Search size={18} className="ml-3.5 mr-2.5 shrink-0 text-ink-2" />
            <input
              ref={searchRef}
              id="desktop-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes, ingredients, chefs"
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none"
            />
            <span className="mr-2.5 flex h-6 items-center rounded-[6px] border border-line px-[7px] text-[12px] text-ink-2">
              /
            </span>
          </div>
        </div>
        {isEditor && (
          <Link
            href="/admin"
            prefetch={false}
            className="flex h-[34px] items-center rounded-full border-[1.5px] border-line px-3.5 text-[14px] font-semibold"
          >
            Admin
          </Link>
        )}
        <TransitionLink href="/profile" aria-label="Profile" className="shrink-0">
          <Avatar params={me.avatar} size={36} />
        </TransitionLink>
      </header>
      <div className="lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[340px_minmax(0,1fr)]">
        {sidebar}
        <main className="lg:overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="lg:mx-auto lg:max-w-[1040px] lg:px-10 lg:pb-16 lg:pt-9">{children}</div>
        </main>
      </div>
    </div>
  )
}

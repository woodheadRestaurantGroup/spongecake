'use client'

import Link from 'next/link'
import React, { useActionState, useEffect, useOptimistic, useState, useTransition } from 'react'

import { Avatar } from '@/components/Avatar'
import { BackButton, TransitionLink } from '@/components/nav/ViewTransitions'
import { Button, DraftBadge, SectionLabel, TagPill, cx } from '@/components/ui'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ChevronSmall, Clock, Heart, Minus, Phone, Plus } from '@/components/ui/icons'
import { formatIngredientQuantity, formatQuantity, scaleFactor } from '@/lib/recipes/scaling'

import {
  submitSuggestionAction,
  toggleFavouriteAction,
  type SuggestionState,
} from '@/app/(frontend)/(app)/actions'

import { CookMode } from './CookMode'
import type { IngredientRow, RecipeView } from './types'

const MULTIPLIERS: [string, number][] = [
  ['½×', 0.5],
  ['1×', 1],
  ['2×', 2],
  ['3×', 3],
]

function clampYield(value: number, step: number): number {
  if (!Number.isFinite(value)) return step
  return Math.max(step, Math.round(value * 100) / 100)
}

/** Grid row for one ingredient; `size` switches between the recipe page and the cook-mode sheet. */
export function IngredientLine({
  row,
  factor,
  scaled,
  size = 'recipe',
  from,
}: {
  row: IngredientRow
  factor: number
  scaled: boolean
  size?: 'recipe' | 'sheet'
  from?: string
}) {
  const fixed = row.scales === false
  const qty =
    row.quantity === null
      ? fixed
        ? '—'
        : ''
      : fixed
        ? formatIngredientQuantity({ ...row, scales: false }, 1)
        : formatIngredientQuantity(row, factor)
  const qtyColour = fixed ? 'text-ink-3' : scaled ? 'text-accent' : 'text-ink'
  const name = row.subRecipe ? row.subRecipe.title : row.item
  const sheet = size === 'sheet'

  const inner = (
    <>
      <span
        className={cx(
          'whitespace-nowrap text-right font-semibold tabular transition-colors duration-[160ms]',
          sheet ? 'text-[20px]' : 'text-[18px]',
          qtyColour,
        )}
      >
        {qty || (fixed ? '—' : '')}
      </span>
      <span className={cx(sheet ? 'text-[20px] leading-[1.35]' : 'text-[18px] leading-[1.4]')}>
        {name}
        {row.note && <span className="text-ink-2">, {row.note}</span>}
      </span>
      {!sheet && (
        <span className="self-center">
          {row.subRecipe && (
            <span className="flex h-[30px] items-center gap-0.5 rounded-[8px] bg-surface-2 pl-2.5 pr-1.5 text-[13px] font-semibold">
              Recipe
              <ChevronSmall />
            </span>
          )}
          {fixed && scaled && !row.subRecipe && (
            <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-2">
              Not scaled
            </span>
          )}
        </span>
      )}
    </>
  )

  const cls = cx(
    'grid items-baseline border-b border-line',
    sheet
      ? 'grid-cols-[104px_minmax(0,1fr)] gap-x-3.5 py-3'
      : 'grid-cols-[96px_minmax(0,1fr)_auto] gap-x-3.5 py-[13px] lg:grid-cols-[88px_minmax(0,1fr)_auto] lg:py-[11px]',
  )

  if (row.subRecipe && !sheet) {
    return (
      <TransitionLink
        href={`/recipes/${row.subRecipe.slug}?from=${encodeURIComponent(from ?? '')}`}
        className={cx(cls, 'w-full text-left active:bg-surface-2')}
      >
        {inner}
      </TransitionLink>
    )
  }
  return <div className={cls}>{inner}</div>
}

function Scaler({
  base,
  label,
  step,
  target,
  onChange,
  compact,
}: {
  base: number
  label: string
  step: number
  target: number
  onChange: (next: number) => void
  compact?: boolean
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? formatQuantity(target)
  const factor = scaleFactor(base, target)
  const scaled = Math.abs(factor - 1) > 1e-9
  const commit = (v: number) => onChange(clampYield(v, step))
  const btn = compact ? 'h-12 w-12' : 'h-14 w-14'

  return (
    <div className="rounded-[16px] border border-line bg-surface p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Decrease"
          onClick={() => commit(target - step)}
          className={cx(
            btn,
            'flex shrink-0 items-center justify-center rounded-[12px] bg-surface-2 transition-transform duration-[90ms] active:scale-[0.94]',
          )}
        >
          <Minus size={compact ? 20 : 22} />
        </button>
        <label
          className={cx(
            'flex min-w-0 flex-1 items-center justify-center',
            compact ? 'items-baseline gap-2' : 'flex-col',
          )}
        >
          <span className="sr-only">Yield</span>
          <input
            id="yield"
            type="text"
            inputMode="decimal"
            value={shown}
            onFocus={() => setDraft(formatQuantity(target))}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              commit(Number(shown.replace(/,/g, '')))
              setDraft(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            className={cx(
              'min-w-0 bg-transparent font-semibold tabular outline-none transition-colors duration-[160ms]',
              compact
                ? 'w-[84px] text-right text-[28px]'
                : 'w-full text-center text-[32px] leading-[1.05]',
              scaled ? 'text-accent' : 'text-ink',
            )}
          />
          <span className={cx('text-ink-2', compact ? 'text-[15px]' : 'text-[14px]')}>{label}</span>
        </label>
        <button
          type="button"
          aria-label="Increase"
          onClick={() => commit(target + step)}
          className={cx(
            btn,
            'flex shrink-0 items-center justify-center rounded-[12px] bg-surface-2 transition-transform duration-[90ms] active:scale-[0.94]',
          )}
        >
          <Plus size={compact ? 20 : 22} />
        </button>
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-1.5">
        {MULTIPLIERS.map(([text, m]) => {
          const active = Math.abs(factor - m) < 1e-9
          return (
            <button
              key={text}
              type="button"
              aria-pressed={active}
              onClick={() => commit(base * m)}
              className={cx(
                'rounded-[10px] border-[1.5px] font-semibold tabular transition-[background-color,border-color] duration-[120ms] active:scale-[0.95]',
                compact ? 'h-10 text-[15px]' : 'h-11 text-[16px]',
                active
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line bg-transparent text-ink',
              )}
            >
              {text}
            </button>
          )
        })}
      </div>
      <div
        className={cx(
          'flex items-center justify-between gap-2 px-1',
          compact ? 'mt-1.5 min-h-[34px]' : 'mt-2 min-h-9',
        )}
      >
        <span className="text-[14px] text-ink-2">
          {scaled
            ? `Scaled ×${formatQuantity(factor)} from ${formatQuantity(base)} ${label}`
            : `Base recipe · ${formatQuantity(base)} ${label}`}
        </span>
        {scaled && (
          <button
            type="button"
            onClick={() => commit(base)}
            className="-mr-1.5 h-9 rounded-[8px] px-2.5 text-[14px] font-semibold active:bg-surface-2"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

function SuggestSheet({
  recipeId,
  open,
  onClose,
}: {
  recipeId: number
  open: boolean
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const [state, action, pending] = useActionState<SuggestionState, FormData>(
    async (prev, formData) => {
      const result = await submitSuggestionAction(prev, formData)
      if (result.ok) setText('')
      return result
    },
    {},
  )
  return (
    <BottomSheet open={open} onClose={onClose} height="auto" label="Suggest an edit">
      <form action={action} className="px-4 pb-4">
        <input type="hidden" name="recipeId" value={recipeId} />
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-[22px] font-semibold">Suggest an edit</span>
        </div>
        {state.ok ? (
          <div className="py-6">
            <p className="text-[17px] font-semibold">Sent to the editors.</p>
            <p className="mt-1 text-[15px] text-ink-2">
              They’ll see it in the admin and can update the recipe.
            </p>
            <Button variant="soft" size="sm" onClick={onClose} className="mt-5">
              Done
            </Button>
          </div>
        ) : (
          <>
            <p className="mt-1.5 text-[15px] leading-[1.45] text-ink-2">
              What should change? Quantities, timings, a step that doesn’t work.
            </p>
            <textarea
              id="suggestion"
              name="body"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              required
              minLength={3}
              maxLength={2000}
              className="mt-3 w-full rounded-[14px] border-[1.5px] border-line bg-bg px-4 py-3 text-[17px] leading-[1.45] outline-none focus:border-ink"
            />
            {state.error && (
              <p className="mt-2 text-[15px] font-semibold text-danger">{state.error}</p>
            )}
            <Button
              type="submit"
              size="md"
              full
              disabled={pending || text.trim().length < 3}
              className="mt-3"
            >
              {pending ? 'Sending…' : 'Send suggestion'}
            </Button>
          </>
        )}
      </form>
    </BottomSheet>
  )
}

export function RecipeScreen({ recipe }: { recipe: RecipeView }) {
  const base = recipe.yield.amount
  const [target, setTarget] = useState(recipe.initialYield ?? base)
  const factor = scaleFactor(base, target)
  const scaled = Math.abs(factor - 1) > 1e-9

  const [scrolled, setScrolled] = useState(false)
  const [histOpen, setHistOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [cook, setCook] = useState(false)

  const [fav, setFav] = useOptimistic(recipe.isFavourite)
  const [, startFav] = useTransition()

  useEffect(() => {
    const url = new URL(window.location.href)
    if (scaled) url.searchParams.set('yield', String(target))
    else url.searchParams.delete('yield')
    window.history.replaceState(window.history.state, '', url)
  }, [target, scaled])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 90)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleFav = () =>
    startFav(async () => {
      setFav(!fav)
      await toggleFavouriteAction(recipe.id)
    })

  const yieldText = `${formatQuantity(target)} ${recipe.yield.label}${scaled ? ` · ×${formatQuantity(factor)}` : ''}`
  const last = recipe.history[0]
  const histSummary = last
    ? `${recipe.history.length} version${recipe.history.length === 1 ? '' : 's'}, last by ${last.name.split(' ')[0]} ${last.when}`
    : 'no saved versions yet'

  const heart = (
    <button
      type="button"
      aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
      aria-pressed={fav}
      onClick={toggleFav}
      className="flex h-11 w-11 items-center justify-center rounded-[12px] transition-transform duration-[90ms] active:scale-[0.88] lg:border-[1.5px] lg:border-line lg:hover:bg-surface-2"
    >
      <Heart filled={fav} className={fav ? 'text-accent' : 'text-ink'} size={24} />
    </button>
  )

  const historyBlock = (
    <>
      <button
        type="button"
        onClick={() => setHistOpen((v) => !v)}
        aria-expanded={histOpen}
        className="mt-5 flex min-h-[52px] w-full items-center gap-2.5 border-y border-line text-left text-[15px] text-ink-2 active:opacity-70 lg:mt-0 lg:min-h-12 lg:flex-1"
      >
        <Clock />
        <span className="min-w-0 flex-1">History · {histSummary}</span>
        <ChevronSmall
          size={18}
          className={cx('transition-transform duration-[180ms]', histOpen && 'rotate-90')}
        />
      </button>
    </>
  )

  const historyList = histOpen && (
    <div className="border-b border-line py-1 pb-2 lg:max-w-[620px]">
      {recipe.history.map((h, i) => (
        <div key={i} className="flex gap-2.5 py-2.5 text-[15px] leading-[1.4]">
          <Avatar params={h.avatar} size={24} />
          <div className="min-w-0 flex-1">
            <div>
              <span className="font-semibold">{h.name}</span>
              <span className="text-ink-2"> · {h.when}</span>
            </div>
            {h.note && <div className="text-ink-2">{h.note}</div>}
          </div>
        </div>
      ))}
      {recipe.history.length === 0 && (
        <p className="py-2.5 text-[15px] text-ink-2">Nothing saved yet.</p>
      )}
    </div>
  )

  const method = (
    <>
      <h2 className="text-[22px] font-semibold tracking-[-0.01em]">Method</h2>
      <ol className="mt-2 flex flex-col lg:mt-1.5 lg:max-w-[620px]">
        {recipe.steps.map((st, i) => (
          <li key={st.id} className="flex gap-3.5 py-3.5 lg:gap-4">
            <span className="-mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line text-[15px] font-semibold text-ink-2 tabular">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="prose-steps text-[18px] leading-[1.5] text-pretty lg:leading-[1.55]">
                {st.node}
              </div>
              {st.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={st.imageUrl}
                  alt=""
                  className="mt-3 aspect-[16/10] w-full rounded-[12px] object-cover lg:max-w-[420px]"
                  loading="lazy"
                />
              )}
            </div>
          </li>
        ))}
      </ol>
    </>
  )

  const notes = recipe.notes && (
    <div className="mt-5 rounded-[14px] bg-surface-2 p-4 lg:max-w-[620px] lg:p-[18px]">
      <SectionLabel>Chef’s note</SectionLabel>
      <div className="prose-steps mt-1.5 text-[17px] leading-[1.5]">{recipe.notes}</div>
    </div>
  )

  const ingredients = (
    <>
      {recipe.sections.map((sec) => (
        <div key={sec.id} className="mt-[18px] lg:mt-4">
          {sec.title && <SectionLabel className="pb-1 lg:text-[12px]">{sec.title}</SectionLabel>}
          {sec.ingredients.map((row) => (
            <IngredientLine
              key={row.id}
              row={row}
              factor={factor}
              scaled={scaled}
              from={recipe.title}
            />
          ))}
        </div>
      ))}
    </>
  )

  return (
    <article>
      {/* Phone top bar */}
      <div
        className="sticky top-0 z-20 flex h-[52px] items-center bg-bg px-2 lg:hidden"
        style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <BackButton href={recipe.backHref} label={recipe.backLabel} />
        <div
          className={cx(
            'min-w-0 flex-1 truncate text-center text-[16px] font-semibold transition-opacity duration-150',
            scrolled ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden={!scrolled}
        >
          {recipe.title}
        </div>
        {recipe.canEdit && (
          <Link
            href={recipe.adminUrl}
            prefetch={false}
            className="flex h-11 items-center rounded-[12px] px-2.5 text-[16px] font-semibold active:bg-surface-2"
          >
            Edit
          </Link>
        )}
        {heart}
      </div>

      <div className="px-4 pt-2 lg:px-0 lg:pt-0">
        {/* Desktop header row */}
        <div className="lg:flex lg:items-start lg:gap-6">
          <div className="min-w-0 flex-1">
            {recipe.draft && (
              <div className="mb-2.5">
                <DraftBadge />
              </div>
            )}
            <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-pretty lg:text-[40px] lg:leading-[1.1] lg:tracking-[-0.02em]">
              {recipe.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[15px] lg:mt-3.5 lg:gap-2.5">
              <Avatar params={recipe.author.avatar} size={24} />
              <span className="font-semibold">{recipe.author.name}</span>
              <span className="text-ink-2">· {recipe.updated}</span>
              {recipe.tags.length > 0 && (
                <span className="hidden gap-1.5 lg:ml-1.5 lg:flex">
                  {recipe.tags.map((t) => (
                    <TagPill key={t}>{t}</TagPill>
                  ))}
                </span>
              )}
            </div>
            {recipe.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 lg:hidden">
                {recipe.tags.map((t) => (
                  <TagPill key={t}>{t}</TagPill>
                ))}
              </div>
            )}
          </div>
          <div className="hidden shrink-0 gap-2 pt-1 lg:flex">
            {heart}
            <a
              href={recipe.printUrl}
              target="_blank"
              rel="noopener"
              className="flex h-11 items-center rounded-[12px] border-[1.5px] border-line px-4 text-[15px] font-semibold hover:bg-surface-2"
            >
              Print
            </a>
            {recipe.canEdit && (
              <Link
                href={recipe.adminUrl}
                prefetch={false}
                className="flex h-11 items-center rounded-[12px] border-[1.5px] border-line px-4 text-[15px] font-semibold hover:bg-surface-2"
              >
                Edit
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCook(true)}
              className="flex h-11 items-center rounded-[12px] bg-ink px-[18px] text-[15px] font-semibold text-bg active:scale-[0.98]"
            >
              Cook mode
            </button>
          </div>
        </div>

        {recipe.heroUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.heroUrl}
            alt=""
            className="mt-[18px] aspect-[4/3] w-full rounded-[16px] object-cover lg:hidden"
          />
        )}

        <div className="lg:mt-8 lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start lg:gap-12">
          <div className="lg:sticky lg:top-6">
            <div className="mt-[22px] lg:mt-0">
              <Scaler
                base={base}
                label={recipe.yield.label}
                step={recipe.yield.step}
                target={target}
                onChange={setTarget}
              />
            </div>
            <h2 className="mt-8 text-[22px] font-semibold tracking-[-0.01em] lg:mt-7">
              Ingredients
            </h2>
            {ingredients}
          </div>

          <div className="mt-9 lg:mt-0">
            {method}
            {notes}
            <div className="flex flex-col lg:mt-5 lg:max-w-[620px] lg:flex-row lg:flex-wrap lg:items-center lg:gap-3">
              {historyBlock}
              <div className="order-2 lg:order-3 lg:basis-full">{historyList}</div>
              <button
                type="button"
                onClick={() => setSuggestOpen(true)}
                className="order-3 mt-4 h-[52px] w-full rounded-[14px] border-[1.5px] border-line text-[16px] font-semibold active:bg-surface-2 lg:order-2 lg:mt-0 lg:h-12 lg:w-auto lg:shrink-0 lg:rounded-[12px] lg:px-4 lg:text-[15px] lg:hover:bg-surface-2"
              >
                Suggest an edit
              </button>
            </div>
          </div>
        </div>
        <div className="h-[120px] lg:h-0" />
      </div>

      <div
        className="sticky bottom-0 z-10 border-t border-line bg-bg px-4 pt-3 lg:hidden"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
      >
        <Button size="lg" full onClick={() => setCook(true)}>
          <Phone />
          Cook mode
        </Button>
      </div>

      <SuggestSheet recipeId={recipe.id} open={suggestOpen} onClose={() => setSuggestOpen(false)} />
      <CookMode
        open={cook}
        onClose={() => setCook(false)}
        recipe={recipe}
        factor={factor}
        scaled={scaled}
        yieldText={yieldText}
      />
    </article>
  )
}

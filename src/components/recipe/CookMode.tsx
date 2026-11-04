'use client'

import React, { useEffect, useRef, useState } from 'react'

import { cx } from '@/components/ui'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Check, Close, List } from '@/components/ui/icons'

import { IngredientLine } from './RecipeScreen'
import type { RecipeView } from './types'

type WakeLock = { release: () => Promise<void> }

/**
 * Full-screen stepping overlay with checkable steps, a progress bar, an
 * ingredients sheet and a screen wake lock while open.
 */
export function CookMode({
  open,
  onClose,
  recipe,
  factor,
  scaled,
  yieldText,
}: {
  open: boolean
  onClose: () => void
  recipe: RecipeView
  factor: number
  scaled: boolean
  yieldText: string
}) {
  const total = recipe.steps.length
  const [done, setDone] = useState<boolean[]>(() => recipe.steps.map(() => false))
  const [sheet, setSheet] = useState(false)
  const [awake, setAwake] = useState(false)
  const lock = useRef<WakeLock | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const current = done.findIndex((d) => !d)
  const doneCount = done.filter(Boolean).length

  useEffect(() => {
    if (!open) {
      const held = lock.current
      lock.current = null
      document.body.style.overflow = ''
      if (held)
        held
          .release()
          .catch(() => {})
          .finally(() => setAwake(false))
      return
    }
    document.body.style.overflow = 'hidden'
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLock> }
    }
    let cancelled = false
    const request = () =>
      nav.wakeLock
        ?.request('screen')
        .then((l) => {
          if (cancelled) l.release().catch(() => {})
          else {
            lock.current = l
            setAwake(true)
          }
        })
        .catch(() => setAwake(false))
    request()
    const onVisible = () => {
      if (document.visibilityState === 'visible' && open) request()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (sheet) setSheet(false)
      else onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, sheet, onClose])

  const toggle = (i: number) => setDone((d) => d.map((v, j) => (j === i ? !v : v)))

  const next = () => {
    if (current === -1) {
      onClose()
      return
    }
    setDone((d) => d.map((v, j) => (j === current ? true : v)))
    const el = listRef.current?.children[current + 1] as HTMLElement | undefined
    if (el && listRef.current)
      listRef.current.scrollTo({ top: el.offsetTop - 60, behavior: 'smooth' })
  }

  return (
    <div
      className={cx(
        'fixed inset-0 z-30 flex flex-col bg-bg transition-transform duration-[320ms] ease-ios',
        open ? 'translate-y-0' : 'pointer-events-none translate-y-full',
      )}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-label="Cook mode"
    >
      <div
        className="flex items-center gap-2.5 px-3"
        style={{ paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Exit cook mode"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-2 transition-transform duration-[90ms] active:scale-[0.92]"
        >
          <Close />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-semibold">{recipe.title}</div>
          <div className="text-[14px] text-ink-2">{yieldText}</div>
        </div>
        <div
          className={cx(
            'flex shrink-0 items-center gap-1.5 pr-1.5 text-[13px] text-ink-2',
            !awake && 'opacity-60',
          )}
        >
          <span className={cx('h-[7px] w-[7px] rounded-full', awake ? 'bg-accent' : 'bg-ink-3')} />
          {awake ? 'Screen on' : 'Screen may sleep'}
        </div>
      </div>

      <div className="px-4 pb-1.5 pt-4">
        <div className="h-1 overflow-hidden rounded-[2px] bg-line">
          <div
            className="h-full rounded-[2px] bg-accent transition-[width] duration-[220ms] ease-ios"
            style={{ width: `${total ? Math.round((doneCount / total) * 100) : 0}%` }}
          />
        </div>
        <div className="mt-2 text-[14px] font-semibold text-ink-2">
          {current === -1 ? 'All steps done' : `Step ${current + 1} of ${total}`}
        </div>
      </div>

      <div
        ref={listRef}
        className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 pb-4 pt-1"
      >
        {recipe.steps.map((st, i) => {
          const isDone = done[i]
          const isCurrent = i === current
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={isDone}
              className={cx(
                'flex w-full shrink-0 gap-3.5 rounded-[16px] px-3.5 py-[18px] text-left transition-[opacity,background-color] duration-[160ms] active:scale-[0.99]',
                isCurrent ? 'bg-surface shadow-[0_0_0_1.5px_var(--color-line)]' : 'bg-transparent',
                isDone && 'opacity-45',
              )}
            >
              <span
                className={cx(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border-2 transition-colors duration-[120ms]',
                  isDone ? 'border-accent bg-accent text-white' : 'border-ink-3 bg-transparent',
                )}
              >
                {isDone && <Check />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-2">
                  Step {i + 1}
                </span>
                <span className="prose-steps mt-1 block text-[22px] leading-[1.45] text-pretty">
                  {st.node}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div
        className="flex gap-2.5 border-t border-line px-4 pt-2.5"
        style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="flex h-[60px] flex-1 items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-line bg-surface text-[18px] font-semibold active:scale-[0.98]"
        >
          <List />
          Ingredients
        </button>
        <button
          type="button"
          onClick={next}
          className="h-[60px] flex-1 rounded-[16px] bg-ink text-[18px] font-semibold text-bg active:scale-[0.98]"
        >
          {current === -1 ? 'Finish' : 'Done, next'}
        </button>
      </div>

      <BottomSheet open={sheet} onClose={() => setSheet(false)} label="Ingredients">
        <div className="flex items-baseline justify-between px-4 py-1">
          <span className="text-[22px] font-semibold">Ingredients</span>
          <span className="text-[15px] text-ink-2">{yieldText}</span>
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-10">
          {recipe.sections.map((sec) => (
            <div key={sec.id} className="mt-3.5">
              {sec.title && (
                <div className="pb-0.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-2">
                  {sec.title}
                </div>
              )}
              {sec.ingredients.map((row) => (
                <IngredientLine
                  key={row.id}
                  row={row}
                  factor={factor}
                  scaled={scaled}
                  size="sheet"
                />
              ))}
            </div>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}

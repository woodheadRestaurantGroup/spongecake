'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { formatIngredientQuantity, formatQuantity, scaleFactor } from '@/lib/recipes/scaling'

export type IngredientRow = {
  id: string
  quantity: number | null
  unit: string | null
  unitLabel: string | null
  item: string | null
  note: string | null
  scales: boolean
  subRecipe: { title: string; slug: string } | null
}

export type IngredientSection = { id: string; title: string | null; ingredients: IngredientRow[] }

type Props = {
  sections: IngredientSection[]
  baseYield: number
  yieldLabel: string
  initialYield?: number
}

const MULTIPLIERS = [0.5, 1, 2, 3]

function clampYield(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(100000, Math.max(0.25, Math.round(value * 100) / 100))
}

export function ScaledIngredients({ sections, baseYield, yieldLabel, initialYield }: Props) {
  const [target, setTarget] = useState<number>(initialYield ?? baseYield)
  const [draft, setDraft] = useState<string>(String(initialYield ?? baseYield))

  // Keep the chosen yield in the URL so reloads, shares and print keep it.
  useEffect(() => {
    const url = new URL(window.location.href)
    if (target === baseYield) url.searchParams.delete('yield')
    else url.searchParams.set('yield', String(target))
    window.history.replaceState(window.history.state, '', url)
  }, [target, baseYield])

  const factor = scaleFactor(baseYield, target)
  const step = baseYield >= 4 ? 1 : 0.5

  function commit(value: number) {
    const next = clampYield(value)
    setTarget(next)
    setDraft(String(next))
  }

  return (
    <section aria-labelledby="ingredients-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="ingredients-heading" className="text-xl font-semibold">
          Ingredients
        </h2>
        {factor !== 1 && (
          <button
            type="button"
            onClick={() => commit(baseYield)}
            className="text-sm font-medium text-accent"
          >
            Reset
          </button>
        )}
      </div>

      <div className="mb-4 rounded-xl bg-white p-3 ring-1 ring-stone-200 dark:bg-stone-800 dark:ring-stone-700">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Less"
            onClick={() => commit(target - step)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-2xl font-medium active:bg-stone-200 dark:bg-stone-700 dark:active:bg-stone-600"
          >
            −
          </button>
          <label className="flex min-w-0 flex-1 items-baseline justify-center gap-1.5">
            <span className="sr-only">Yield</span>
            <input
              type="number"
              inputMode="decimal"
              min={0.25}
              step={step}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => commit(Number(draft))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
              className="w-20 rounded-md border border-stone-300 bg-transparent px-2 py-1 text-center text-2xl font-semibold tabular-nums outline-none focus:border-accent dark:border-stone-600"
            />
            <span className="truncate text-base text-stone-600 dark:text-stone-300">
              {yieldLabel}
            </span>
          </label>
          <button
            type="button"
            aria-label="More"
            onClick={() => commit(target + step)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-2xl font-medium active:bg-stone-200 dark:bg-stone-700 dark:active:bg-stone-600"
          >
            +
          </button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {MULTIPLIERS.map((m) => {
            const value = clampYield(baseYield * m)
            const active = target === value
            return (
              <button
                key={m}
                type="button"
                aria-pressed={active}
                onClick={() => commit(value)}
                className={`h-9 rounded-lg text-sm font-semibold ${
                  active
                    ? 'bg-accent text-white'
                    : 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-200'
                }`}
              >
                {m === 0.5 ? '½×' : `${m}×`}
              </button>
            )
          })}
        </div>
        {factor !== 1 && (
          <p className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
            Scaled ×{formatQuantity(factor)} from {formatQuantity(baseYield)} {yieldLabel}
          </p>
        )}
      </div>

      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.id}>
            {section.title && (
              <h3 className="mb-2 text-base font-semibold text-stone-700 dark:text-stone-200">
                {section.title}
              </h3>
            )}
            <ul className="divide-y divide-stone-200 dark:divide-stone-700">
              {section.ingredients.map((ing) => {
                const qty = formatIngredientQuantity(ing, factor)
                return (
                  <li
                    key={ing.id}
                    className="flex items-baseline gap-3 py-2.5 text-lg leading-snug"
                  >
                    <span className="w-24 shrink-0 text-right font-semibold tabular-nums">
                      {qty}
                    </span>
                    <span className="min-w-0">
                      {ing.subRecipe ? (
                        <Link
                          href={`/recipes/${ing.subRecipe.slug}`}
                          prefetch
                          className="font-medium text-accent underline-offset-2 hover:underline"
                        >
                          {ing.subRecipe.title}
                        </Link>
                      ) : (
                        ing.item
                      )}
                      {ing.note && (
                        <span className="text-stone-500 dark:text-stone-400">, {ing.note}</span>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

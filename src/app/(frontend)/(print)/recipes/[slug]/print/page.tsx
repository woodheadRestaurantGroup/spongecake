import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import React from 'react'

import { StepText } from '@/components/recipe/StepText'
import { getRecipeBySlug, listRecipeHistory, tagSummary } from '@/lib/recipes/queries'
import {
  formatIngredientQuantity,
  formatQuantity,
  parseYieldParam,
  scaleFactor,
} from '@/lib/recipes/scaling'
import { toSections } from '@/lib/recipes/view'
import { getRequestContext } from '@/lib/request'

import { PrintNow } from './PrintNow'

type Params = Promise<{ slug: string }>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

export const metadata: Metadata = { title: 'Print' }

function longDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/London',
  })
}

/** A4 text-only sheet, black on white. Respects ?yield= from the recipe page. */
export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const ctx = await getRequestContext()
  if (!ctx.site) notFound()
  if (!ctx.user) redirect(`/sign-in?redirect=${encodeURIComponent(ctx.pathname)}`)
  if (!ctx.role) notFound()
  const recipe = await getRecipeBySlug(ctx.payload, ctx.site.id, slug)
  if (!recipe) notFound()

  const base = recipe.yield.amount
  const target = parseYieldParam(query.yield) ?? base
  const factor = scaleFactor(base, target)
  const scaled = Math.abs(factor - 1) > 1e-9
  const sections = toSections(recipe)
  const history = await listRecipeHistory(ctx.payload, recipe, 1)
  const versions = await ctx.payload.countVersions({
    collection: 'recipes',
    where: { parent: { equals: recipe.id } },
    overrideAccess: true,
  })
  const author = typeof recipe.author === 'object' ? recipe.author.name : ''
  const tags = (recipe.tags ?? [])
    .map(tagSummary)
    .filter((t) => t !== null)
    .map((t) => t.name)
    .join(' · ')

  return (
    <div
      className="print-sheet"
      style={{
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        color: '#000',
        background: '#fff',
      }}
    >
      <style>{`
        @page { size: A4 portrait; margin: 16mm; }
        html, body { background: #fff !important; color: #000 !important; }
        .print-sheet { max-width: 178mm; margin: 0 auto; padding: 16mm 0; }
        .print-row, .print-section, .print-note, .print-step { break-inside: avoid; }
        .print-step { orphans: 3; widows: 3; }
        .print-foot { font-size: 8.5pt; display: flex; justify-content: space-between; gap: 12pt; border-top: 0.75pt solid #000; padding-top: 5pt; margin-top: 18pt; }
        .print-sheet a { color: #000; text-decoration: none; }
        .print-sheet .prose-steps p { margin: 0; }
        @media print {
          .print-sheet { padding: 0; max-width: none; }
          .no-print { display: none !important; }
          .print-foot { position: fixed; bottom: 0; left: 0; right: 0; }
          .print-sheet { padding-bottom: 24pt; }
        }
        @media screen {
          .print-sheet { padding: 24px 16px 48px; }
        }
      `}</style>
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          fontSize: 14,
        }}
      >
        <a href={`/recipes/${recipe.slug}`}>← Back to recipe</a>
        <PrintNow />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '12pt',
          fontSize: '9pt',
          fontWeight: 600,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
        }}
      >
        <span>{ctx.site.name}</span>
        <span>{tags}</span>
      </div>
      <div
        style={{
          marginTop: '10pt',
          fontSize: '26pt',
          lineHeight: 1.1,
          fontWeight: 600,
          letterSpacing: '-0.01em',
        }}
      >
        {recipe.title}
      </div>
      <div
        style={{
          marginTop: '8pt',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4pt 18pt',
          fontSize: '11pt',
        }}
      >
        <span>
          <b style={{ fontWeight: 600 }}>Yield</b> {formatQuantity(target)} {recipe.yield.label}
        </span>
        {scaled && (
          <span>
            <b style={{ fontWeight: 600 }}>Scaled</b> ×{formatQuantity(factor)} from{' '}
            {formatQuantity(base)} {recipe.yield.label}
          </span>
        )}
        <span>
          <b style={{ fontWeight: 600 }}>By</b> {author}
        </span>
      </div>
      <div style={{ marginTop: '12pt', borderTop: '1.5pt solid #000' }} />

      <div
        style={{
          marginTop: '14pt',
          display: 'grid',
          gridTemplateColumns: '38% minmax(0,1fr)',
          gap: '0 22pt',
          alignItems: 'start',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '9pt',
              fontWeight: 600,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
            }}
          >
            Ingredients
          </div>
          {sections.map((sec) => (
            <div key={sec.id} className="print-section" style={{ marginTop: '10pt' }}>
              {sec.title && (
                <div
                  style={{
                    fontSize: '10.5pt',
                    fontWeight: 600,
                    paddingBottom: '3pt',
                    borderBottom: '0.75pt solid #000',
                  }}
                >
                  {sec.title}
                </div>
              )}
              {sec.ingredients.map((row) => {
                const fixed = row.scales === false
                const qty =
                  row.quantity === null
                    ? fixed
                      ? '—'
                      : ''
                    : fixed
                      ? formatIngredientQuantity({ ...row, scales: false }, 1)
                      : formatIngredientQuantity(row, factor)
                return (
                  <div
                    key={row.id}
                    className="print-row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '52pt minmax(0,1fr)',
                      gap: '8pt',
                      padding: '4pt 0',
                      borderBottom: '0.5pt solid #999',
                      fontSize: '10.5pt',
                      lineHeight: 1.35,
                    }}
                  >
                    <span
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {qty}
                    </span>
                    <span>
                      {row.subRecipe ? row.subRecipe.title : row.item}
                      {row.note ? `, ${row.note}` : ''}
                      {row.subRecipe && ' (see recipe)'}
                      {fixed && scaled && (
                        <span style={{ fontStyle: 'italic' }}> — not scaled</span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div>
          <div
            style={{
              fontSize: '9pt',
              fontWeight: 600,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
            }}
          >
            Method
          </div>
          <div style={{ marginTop: '6pt' }}>
            {(recipe.method ?? []).map((step, i) => (
              <div
                key={step.id ?? i}
                className="print-step"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '18pt minmax(0,1fr)',
                  gap: '6pt',
                  padding: '5pt 0',
                  fontSize: '11pt',
                  lineHeight: 1.45,
                }}
              >
                <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {i + 1}.
                </span>
                <span className="prose-steps">
                  <StepText data={step.text} />
                </span>
              </div>
            ))}
          </div>
          {recipe.notes && (
            <div
              className="print-note"
              style={{ marginTop: '12pt', padding: '8pt 10pt', border: '0.75pt solid #000' }}
            >
              <div
                style={{
                  fontSize: '9pt',
                  fontWeight: 600,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                }}
              >
                Chef’s note
              </div>
              <div
                className="prose-steps"
                style={{ marginTop: '3pt', fontSize: '10.5pt', lineHeight: 1.45 }}
              >
                <StepText data={recipe.notes} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="print-foot">
        <span>
          {recipe.title} · {ctx.site.name} · Spongecake
        </span>
        <span>
          By {author} · v{versions.totalDocs}, updated{' '}
          {longDate(history[0]?.at ?? recipe.updatedAt)} · Printed {longDate(new Date())}
        </span>
      </div>
    </div>
  )
}

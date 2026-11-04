/**
 * Yield scaling. Quantities are never rounded to whole units; they are shown
 * with up to two decimal places and trailing zeros trimmed.
 */

export function scaleFactor(baseYield: number, targetYield: number): number {
  if (!(baseYield > 0) || !(targetYield > 0)) return 1
  return targetYield / baseYield
}

export function scaleQuantity(quantity: number, factor: number): number {
  return quantity * factor
}

/** Formats a quantity with at most two decimals, e.g. 2.5, 0.33, 1200. */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return ''
  const rounded = Math.round(value * 100) / 100
  return rounded.toLocaleString('en-GB', { maximumFractionDigits: 2 })
}

export type UnitDisplay = { unit?: string | null; unitLabel?: string | null }

/** The unit text to print after a quantity. "none" prints nothing. */
export function displayUnit({ unit, unitLabel }: UnitDisplay): string {
  if (!unit || unit === 'none') return ''
  if (unit === 'other') return (unitLabel || '').trim()
  if (unit === 'each') return ''
  return unit
}

export type IngredientLike = {
  quantity?: number | null
  unit?: string | null
  unitLabel?: string | null
  scales?: boolean | null
}

/** The quantity string for an ingredient at a given scale factor, e.g. "250 g" or "to taste". */
export function formatIngredientQuantity(ingredient: IngredientLike, factor: number): string {
  const { quantity } = ingredient
  if (quantity === null || quantity === undefined) return ''
  const scaled = ingredient.scales === false ? quantity : scaleQuantity(quantity, factor)
  const unit = displayUnit(ingredient)
  const amount = formatQuantity(scaled)
  return unit ? `${amount} ${unit}` : amount
}

/** Parses a yield from a URL query value. Returns undefined when absent or invalid. */
export function parseYieldParam(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return undefined
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0 || n > 100000) return undefined
  return Math.round(n * 100) / 100
}

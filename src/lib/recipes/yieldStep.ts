/** How much the steppers move per tap, by the kind of yield. Portions 1, litres 0.5, grams 50, big batches 5. */
export function yieldStep(label: string, base: number): number {
  const l = label.trim().toLowerCase()
  if (/^(l|litre|litres|liter|liters)$/.test(l)) return 0.5
  if (/^(g|gram|grams)$/.test(l)) return 50
  if (/^(kg|kilo|kilos|kilogram|kilograms)$/.test(l)) return 0.5
  if (/^(ml|millilitre|millilitres)$/.test(l)) return 50
  if (base >= 50) return 5
  return 1
}

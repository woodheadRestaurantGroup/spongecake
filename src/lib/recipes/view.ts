import type { IngredientSection } from '@/components/recipe/types'
import type { Recipe } from '@/payload-types'

/** Flattens Payload's ingredient groups into the plain shape the screens render. */
export function toSections(recipe: Recipe): IngredientSection[] {
  return (recipe.ingredientSections ?? []).map((section, i) => ({
    id: section.id ?? String(i),
    title: section.title ?? null,
    ingredients: (section.ingredients ?? []).map((ing, j) => ({
      id: ing.id ?? `${i}-${j}`,
      quantity: ing.quantity ?? null,
      unit: ing.unit ?? null,
      unitLabel: ing.unitLabel ?? null,
      item: ing.item ?? null,
      note: ing.note ?? null,
      scales: ing.scales !== false,
      subRecipe:
        ing.subRecipe && typeof ing.subRecipe === 'object'
          ? { title: ing.subRecipe.title, slug: ing.subRecipe.slug ?? String(ing.subRecipe.id) }
          : null,
    })),
  }))
}

import type { ReactNode } from 'react'

import type { AvatarParams } from '@/components/Avatar'

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

export type StepView = { id: string; node: ReactNode; imageUrl: string | null }

export type HistoryView = { name: string; avatar: AvatarParams; when: string; note: string | null }

export type RecipeView = {
  id: number
  slug: string
  title: string
  draft: boolean
  author: { name: string; avatar: AvatarParams }
  updated: string
  tags: string[]
  heroUrl: string | null
  yield: { amount: number; label: string; step: number }
  sections: IngredientSection[]
  steps: StepView[]
  notes: ReactNode | null
  history: HistoryView[]
  isFavourite: boolean
  canEdit: boolean
  adminUrl: string
  printUrl: string
  backLabel: string
  backHref: string
  initialYield?: number
}

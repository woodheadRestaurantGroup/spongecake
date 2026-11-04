import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { Avatar } from '@/components/Avatar'
import type { RecipeSummary } from '@/lib/recipes/queries'

export function RecipeCard({ recipe }: { recipe: RecipeSummary }) {
  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      prefetch
      className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-stone-200 active:bg-stone-100 dark:bg-stone-800 dark:ring-stone-700 dark:active:bg-stone-700"
    >
      {recipe.thumbnail ? (
        <Image
          src={recipe.thumbnail}
          alt=""
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold leading-snug">{recipe.title}</h3>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
          <Avatar seed={recipe.author.avatarSeed} name={recipe.author.name} size={18} />
          <span className="truncate">{recipe.author.name}</span>
          {recipe.tags.length > 0 && <span aria-hidden>·</span>}
          <span className="truncate">{recipe.tags.map((t) => t.name).join(', ')}</span>
        </div>
      </div>
      <svg
        aria-hidden
        className="h-5 w-5 shrink-0 text-stone-300 dark:text-stone-600"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
          clipRule="evenodd"
        />
      </svg>
    </Link>
  )
}

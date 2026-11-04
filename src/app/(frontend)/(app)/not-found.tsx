import Link from 'next/link'
import React from 'react'

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-semibold">Recipe not found</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-300">
        It may have been archived or renamed.
      </p>
      <Link href="/" className="mt-6 inline-block font-medium text-accent">
        Back to all recipes
      </Link>
    </div>
  )
}

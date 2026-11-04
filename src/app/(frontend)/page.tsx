import React from 'react'

/**
 * Holding page. Replaced by the site home in Phase 1.
 * Deliberately static: no database access, so it renders at build time.
 */
export default function HoldingPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center border-t-4 border-accent px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400">
        Woodhead Restaurant Group
      </p>
      <h1 className="mt-3 text-5xl font-semibold tracking-tight">Spongecake</h1>
      <p className="mt-4 max-w-sm text-lg text-stone-600 dark:text-stone-300">
        The recipe database for our kitchens. Coming soon.
      </p>
    </main>
  )
}

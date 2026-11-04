import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { RetryButton } from './RetryButton'

export const metadata: Metadata = { title: 'Offline' }

/** Served by the service worker when a page is requested with no connection and no saved copy. */
export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-12">
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-2">Spongecake</p>
      <h1 className="mt-1 text-[28px] font-semibold leading-[1.15] tracking-[-0.01em]">
        You’re offline
      </h1>
      <p className="mt-2.5 text-[17px] leading-[1.45] text-ink-2">
        Recipes you’ve opened recently and your favourites still work. This page isn’t saved on this
        phone, so it needs a connection.
      </p>
      <div className="mt-7 flex flex-wrap gap-2">
        <RetryButton />
        <Link
          href="/"
          prefetch={false}
          className="flex h-11 items-center rounded-[12px] px-4 text-[15px] font-semibold text-ink-2 active:opacity-70"
        >
          Back to recipes
        </Link>
      </div>
    </div>
  )
}

'use client'

import { useEffect } from 'react'

/** Asks the service worker to save the home page and favourited recipes so they open offline. */
export function PrefetchFavourites({ slugs }: { slugs: string[] }) {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !navigator.onLine) return
    const urls = ['/', ...slugs.map((s) => `/recipes/${s}`)]
    const run = () => {
      navigator.serviceWorker.ready
        .then((reg) => reg.active?.postMessage({ type: 'cache-recipes', urls }))
        .catch(() => {})
    }
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback
    const handle = idle ? idle(run) : window.setTimeout(run, 1500)
    return () => {
      if (!idle) window.clearTimeout(handle as number)
    }
  }, [slugs])
  return null
}

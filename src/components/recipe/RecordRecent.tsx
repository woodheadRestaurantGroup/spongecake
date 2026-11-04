'use client'

import { useEffect } from 'react'

import { writeLocalStorage } from '@/lib/localStorage'
import { parseRecent, recentKey } from '@/lib/recent'

/** Remembers this recipe on the device so the home page can show it under "Recently viewed". */
export function RecordRecent({ siteSlug, slug }: { siteSlug: string; slug: string }) {
  useEffect(() => {
    try {
      const key = recentKey(siteSlug)
      const list = parseRecent(localStorage.getItem(key)).filter((e) => e.slug !== slug)
      const next = [{ slug, at: new Date().toISOString() }, ...list].slice(0, 10)
      writeLocalStorage(key, JSON.stringify(next))
    } catch {}
  }, [siteSlug, slug])
  return null
}

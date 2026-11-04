'use client'

import { useEffect } from 'react'

import { recentKey } from '@/components/home/RecipeBrowser'
import { writeLocalStorage } from '@/lib/localStorage'

/** Remembers this recipe on the device so the home page can show it under "Recently viewed". */
export function RecordRecent({ siteSlug, slug }: { siteSlug: string; slug: string }) {
  useEffect(() => {
    try {
      const key = recentKey(siteSlug)
      const raw = localStorage.getItem(key)
      const list = raw ? (JSON.parse(raw) as string[]) : []
      const next = [slug, ...list.filter((s) => s !== slug)].slice(0, 12)
      writeLocalStorage(key, JSON.stringify(next))
    } catch {}
  }, [siteSlug, slug])
  return null
}

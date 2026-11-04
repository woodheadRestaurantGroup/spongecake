'use client'

import { relativeTime } from '@/lib/recipes/queries'

export type RecentEntry = { slug: string; at: string }

export function recentKey(siteSlug: string) {
  return `recent:${siteSlug}`
}

/** Accepts the old plain-slug format as well as the current {slug, at} entries. */
export function parseRecent(raw: string | null): RecentEntry[] {
  try {
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((e) => (typeof e === 'string' ? { slug: e, at: new Date(0).toISOString() } : e))
      .filter((e): e is RecentEntry =>
        Boolean(e && typeof e === 'object' && typeof (e as RecentEntry).slug === 'string'),
      )
  } catch {
    return []
  }
}

export function viewedLabel(at: string): string {
  if (new Date(at).getTime() === 0) return 'Viewed recently'
  return `Viewed ${relativeTime(at)}`
}

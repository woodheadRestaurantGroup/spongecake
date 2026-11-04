import { cache } from 'react'
import type { Payload } from 'payload'

import type { Site } from '@/payload-types'
import { env } from '@/lib/env'

/** Cookie that remembers a chosen site on addresses that match no site domain (previews, local). */
export const SITE_COOKIE = 'spongecake-site'

/** Lowercases and strips the port, so "Localhost:3000" and "localhost" match the same site. */
export function normaliseHost(host: string | null | undefined): string | null {
  if (!host) return null
  const trimmed = host.trim().toLowerCase()
  const withoutPort = trimmed.replace(/:\d+$/, '')
  return withoutPort || null
}

async function findBySlug(payload: Payload, slug: string): Promise<Site | null> {
  const result = await payload.find({
    collection: 'sites',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  return result.docs[0] ?? null
}

/** The site whose domains include this hostname, or null. */
export const getSiteByDomain = cache(
  async (payload: Payload, rawHost: string | null | undefined): Promise<Site | null> => {
    const host = normaliseHost(rawHost)
    if (!host) return null
    const result = await payload.find({
      collection: 'sites',
      where: { 'domains.hostname': { equals: host } },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })
    return result.docs[0] ?? null
  },
)

/**
 * Resolves the site for a request. Order: the hostname's own site; then,
 * only when the hostname matches nothing, a site chosen earlier on this
 * device (cookie); then DEFAULT_SITE_SLUG. Real site domains always win,
 * so the cookie cannot redirect a production address.
 */
export const getSiteForHost = cache(
  async (
    payload: Payload,
    rawHost: string | null | undefined,
    chosenSlug?: string | null,
  ): Promise<Site | null> => {
    const byDomain = await getSiteByDomain(payload, rawHost)
    if (byDomain) return byDomain

    if (chosenSlug) {
      const chosen = await findBySlug(payload, chosenSlug)
      if (chosen) return chosen
    }

    if (env.defaultSiteSlug) {
      const fallback = await findBySlug(payload, env.defaultSiteSlug)
      if (fallback) return fallback
    }

    return null
  },
)

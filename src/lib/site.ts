import { cache } from 'react'
import type { Payload } from 'payload'

import type { Site } from '@/payload-types'
import { env } from '@/lib/env'

/** Lowercases and strips the port, so "Localhost:3000" and "localhost" match the same site. */
export function normaliseHost(host: string | null | undefined): string | null {
  if (!host) return null
  const trimmed = host.trim().toLowerCase()
  const withoutPort = trimmed.replace(/:\d+$/, '')
  return withoutPort || null
}

/**
 * Finds the site served at a hostname. Falls back to DEFAULT_SITE_SLUG when
 * set, which is how preview deployments and local development resolve.
 */
export const getSiteForHost = cache(
  async (payload: Payload, rawHost: string | null | undefined): Promise<Site | null> => {
    const host = normaliseHost(rawHost)
    if (host) {
      const byDomain = await payload.find({
        collection: 'sites',
        where: { 'domains.hostname': { equals: host } },
        limit: 1,
        depth: 1,
        overrideAccess: true,
      })
      if (byDomain.docs[0]) return byDomain.docs[0]
    }

    if (env.defaultSiteSlug) {
      const bySlug = await payload.find({
        collection: 'sites',
        where: { slug: { equals: env.defaultSiteSlug } },
        limit: 1,
        depth: 1,
        overrideAccess: true,
      })
      if (bySlug.docs[0]) return bySlug.docs[0]
    }

    return null
  },
)

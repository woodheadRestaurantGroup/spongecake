import config from '@payload-config'
import { decodeJwt } from 'jose'
import { headers } from 'next/headers'
import { getPayload, type Payload } from 'payload'
import { cache } from 'react'

import { isGroupAdmin, roleAtSite, type Role } from '@/access/roles'
import { extractToken } from '@/lib/auth/strategy'
import { getSiteForHost } from '@/lib/site'
import type { Site, User } from '@/payload-types'

export const getPayloadClient = cache((): Promise<Payload> => getPayload({ config }))

export type SessionUser = User & { _sid?: string }

export type RequestContext = {
  payload: Payload
  site: Site | null
  user: SessionUser | null
  /** The user's role at the current site, or undefined when not a member. Group Admins read as siteAdmin. */
  role: Role | undefined
  isGroupAdmin: boolean
  sid: string | null
  /** Expiry of the session token as a unix timestamp in seconds, when signed in. */
  tokenExp: number | null
  host: string | null
  origin: string
  /** Path and query of the current request, set by src/proxy.ts. */
  pathname: string
  ip: string | undefined
}

/**
 * Everything a server component or action needs about the current request:
 * which site the hostname maps to and who, if anyone, is signed in.
 * Memoised per request.
 */
export const getRequestContext = cache(async (): Promise<RequestContext> => {
  const h = await headers()
  const payload = await getPayloadClient()
  const host = h.get('host')

  const [site, auth] = await Promise.all([
    getSiteForHost(payload, host),
    payload.auth({ headers: h }),
  ])
  const user = (auth.user as SessionUser | null) ?? null

  let tokenExp: number | null = null
  if (user) {
    const token = extractToken(h, payload.config.cookiePrefix)
    if (token) {
      try {
        tokenExp = decodeJwt(token).exp ?? null
      } catch {
        tokenExp = null
      }
    }
  }

  const proto = h.get('x-forwarded-proto') ?? 'http'
  const forwardedFor = h.get('x-forwarded-for')

  return {
    payload,
    site,
    user,
    role: site && user ? roleAtSite(user, site.id) : undefined,
    isGroupAdmin: isGroupAdmin(user),
    sid: user?._sid ?? null,
    tokenExp,
    host,
    origin: `${proto}://${host ?? 'localhost:3000'}`,
    pathname: h.get('x-pathname') ?? '/',
    ip: forwardedFor?.split(',')[0]?.trim() || h.get('x-real-ip') || undefined,
  }
})

/** Only ever redirect within the app: a relative path that is not protocol-relative. */
export function safeRedirect(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}

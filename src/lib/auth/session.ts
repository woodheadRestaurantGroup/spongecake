import { randomUUID } from 'crypto'
import type { Payload } from 'payload'
import { getFieldsToSign, jwtSign } from 'payload'

import type { User } from '@/payload-types'
import { env } from '@/lib/env'

export type IssuedSession = { token: string; exp: number; sid: string }

type StoredSession = NonNullable<User['sessions']>[number]

function liveSessions(sessions: User['sessions']): StoredSession[] {
  const now = Date.now()
  return (sessions || []).filter((s) => new Date(s.expiresAt).getTime() > now)
}

/**
 * Starts a new session for the user and returns a signed JWT for it.
 * The session is recorded on the user so it can be revoked, exactly as
 * Payload's own login does.
 */
export async function issueSession(payload: Payload, userId: number): Promise<IssuedSession> {
  const collection = payload.collections.users.config
  const tokenExpiration = collection.auth.tokenExpiration

  const user = await payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
    overrideAccess: true,
  })

  const sid = randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + tokenExpiration * 1000)
  const sessions = [
    ...liveSessions(user.sessions),
    { id: sid, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString() },
  ]

  await payload.db.updateOne({
    collection: 'users',
    id: userId,
    data: { ...user, sessions, updatedAt: null },
    returning: false,
  })

  const fieldsToSign = getFieldsToSign({
    collectionConfig: collection,
    email: user.email,
    sid,
    user: { ...user, collection: 'users' },
  })
  const { token, exp } = await jwtSign({ fieldsToSign, secret: payload.secret, tokenExpiration })
  return { token, exp, sid }
}

/** Reissues a token for an existing session, extending its expiry. */
export async function extendSession(
  payload: Payload,
  userId: number,
  sid: string,
): Promise<IssuedSession | null> {
  const collection = payload.collections.users.config
  const tokenExpiration = collection.auth.tokenExpiration

  const user = await payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
    overrideAccess: true,
  })
  const sessions = liveSessions(user.sessions)
  const current = sessions.find((s) => s.id === sid)
  if (!current) return null

  current.expiresAt = new Date(Date.now() + tokenExpiration * 1000).toISOString()
  await payload.db.updateOne({
    collection: 'users',
    id: userId,
    data: { ...user, sessions, updatedAt: null },
    returning: false,
  })

  const fieldsToSign = getFieldsToSign({
    collectionConfig: collection,
    email: user.email,
    sid,
    user: { ...user, collection: 'users' },
  })
  const { token, exp } = await jwtSign({ fieldsToSign, secret: payload.secret, tokenExpiration })
  return { token, exp, sid }
}

export async function revokeSession(payload: Payload, userId: number, sid: string): Promise<void> {
  const user = await payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
    overrideAccess: true,
  })
  const sessions = liveSessions(user.sessions).filter((s) => s.id !== sid)
  await payload.db.updateOne({
    collection: 'users',
    id: userId,
    data: { ...user, sessions, updatedAt: null },
    returning: false,
  })
}

export function sessionCookieName(payload: Payload): string {
  return `${payload.config.cookiePrefix}-token`
}

export function sessionCookieOptions(exp: number) {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax' as const,
    path: '/',
    expires: new Date(exp * 1000),
  }
}

/** True once a session is past the midpoint of its life and should be reissued. */
export function shouldRefreshSession(exp: number | null, tokenExpiration: number): boolean {
  if (exp === null) return false
  return exp - Math.floor(Date.now() / 1000) < tokenExpiration / 2
}

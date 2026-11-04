import { createHash, randomBytes, randomInt } from 'crypto'
import type { Payload } from 'payload'

import { signInEmail, type EmailSite } from '@/lib/emails'
import { env } from '@/lib/env'
import type { User } from '@/payload-types'

export const TOKEN_TTL_MINUTES = 15
const MAX_REQUESTS_PER_EMAIL = 5
const MAX_REQUESTS_PER_IP = 30
const MAX_CODE_ATTEMPTS = 5

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function findUserByEmail(payload: Payload, email: string): Promise<User | null> {
  const result = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs[0] ?? null
}

/**
 * The very first Group Admin. While no Group Admin exists and the email
 * matches BOOTSTRAP_ADMIN_EMAIL, a sign-in request from that address either
 * creates the account or promotes an existing account with that email.
 * Once a Group Admin exists the variable does nothing, so it is safe to leave set.
 */
async function bootstrapGroupAdmin(payload: Payload, email: string): Promise<User | null> {
  if (!env.bootstrapAdminEmail || normaliseEmail(env.bootstrapAdminEmail) !== email) return null
  const admins = await payload.count({
    collection: 'users',
    where: { isGroupAdmin: { equals: true } },
    overrideAccess: true,
  })
  if (admins.totalDocs > 0) return null

  const existing = await findUserByEmail(payload, email)
  if (existing) {
    payload.logger.info({ email }, 'Bootstrap: promoting existing user to Group Admin')
    return payload.update({
      collection: 'users',
      id: existing.id,
      data: { isGroupAdmin: true },
      overrideAccess: true,
    })
  }
  payload.logger.info({ email }, 'Bootstrap: creating the first Group Admin')
  return payload.create({
    collection: 'users',
    data: { email, name: email.split('@')[0], isGroupAdmin: true },
    overrideAccess: true,
  })
}

async function recentRequestCount(
  payload: Payload,
  field: 'email' | 'requestIp',
  value: string,
): Promise<number> {
  const since = new Date(Date.now() - TOKEN_TTL_MINUTES * 60 * 1000).toISOString()
  const result = await payload.count({
    collection: 'login-tokens',
    where: { and: [{ [field]: { equals: value } }, { createdAt: { greater_than: since } }] },
    overrideAccess: true,
  })
  return result.totalDocs
}

export type RequestResult = {
  sent: boolean
  reason?: 'unknown-user' | 'rate-limited' | 'send-failed'
}

/**
 * Creates a one-time token and six-digit code and emails them. Returns the
 * same shape whether or not the email belongs to a user, so callers can show
 * the same "check your inbox" screen either way.
 */
export async function requestSignIn(args: {
  payload: Payload
  email: string
  origin: string
  ip?: string
  redirectTo?: string
  site?: EmailSite
}): Promise<RequestResult> {
  const { payload, origin, ip, redirectTo } = args
  const site: EmailSite = args.site ?? { name: 'Spongecake', accent: '#8B2D2D' }
  const email = normaliseEmail(args.email)

  const user =
    (await bootstrapGroupAdmin(payload, email)) ?? (await findUserByEmail(payload, email))
  if (!user) {
    payload.logger.info({ email }, 'Sign-in requested for an email with no account; nothing sent')
    return { sent: false, reason: 'unknown-user' }
  }

  if ((await recentRequestCount(payload, 'email', email)) >= MAX_REQUESTS_PER_EMAIL) {
    return { sent: false, reason: 'rate-limited' }
  }
  if (ip && (await recentRequestCount(payload, 'requestIp', ip)) >= MAX_REQUESTS_PER_IP) {
    return { sent: false, reason: 'rate-limited' }
  }

  const token = randomBytes(32).toString('base64url')
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000)

  await payload.create({
    collection: 'login-tokens',
    data: {
      user: user.id,
      email,
      tokenHash: sha256(token),
      codeHash: sha256(`${email}:${code}`),
      expiresAt: expiresAt.toISOString(),
      requestIp: ip,
      redirectTo,
      attempts: 0,
    },
    overrideAccess: true,
  })

  const link = `${origin}/auth/verify?token=${encodeURIComponent(token)}`
  const message = signInEmail({ site, name: user.name, link, code, ttlMinutes: TOKEN_TTL_MINUTES })
  try {
    await payload.sendEmail({ to: email, ...message })
  } catch (error) {
    payload.logger.error({ err: error, email }, 'Sign-in email could not be sent')
    return { sent: false, reason: 'send-failed' }
  }

  payload.logger.info({ email }, 'Sign-in email sent')
  return { sent: true }
}

export type VerifyResult = { user: User; redirectTo?: string } | null

async function consume(payload: Payload, tokenId: number): Promise<void> {
  await payload.update({
    collection: 'login-tokens',
    id: tokenId,
    data: { usedAt: new Date().toISOString() },
    overrideAccess: true,
  })
}

/** Redeems a magic link token. Single use, time limited. */
export async function verifyToken(payload: Payload, token: string): Promise<VerifyResult> {
  if (!token) return null
  const result = await payload.find({
    collection: 'login-tokens',
    where: { tokenHash: { equals: sha256(token) } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const record = result.docs[0]
  if (!record || record.usedAt || new Date(record.expiresAt).getTime() < Date.now()) return null
  if (typeof record.user !== 'object') return null

  await consume(payload, record.id)
  return { user: record.user, redirectTo: record.redirectTo ?? undefined }
}

/**
 * Redeems a six-digit code typed into the app. Looks at the newest unused
 * token for the email, counts failed attempts on it, and locks it after a few.
 */
export async function verifyCode(
  payload: Payload,
  rawEmail: string,
  rawCode: string,
): Promise<VerifyResult> {
  const email = normaliseEmail(rawEmail)
  const code = rawCode.replace(/\D/g, '')
  if (code.length !== 6) return null

  const result = await payload.find({
    collection: 'login-tokens',
    where: {
      and: [
        { email: { equals: email } },
        { usedAt: { exists: false } },
        { expiresAt: { greater_than: new Date().toISOString() } },
      ],
    },
    sort: '-createdAt',
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const record = result.docs[0]
  if (!record || typeof record.user !== 'object') return null
  if ((record.attempts ?? 0) >= MAX_CODE_ATTEMPTS) return null

  if (record.codeHash !== sha256(`${email}:${code}`)) {
    await payload.update({
      collection: 'login-tokens',
      id: record.id,
      data: { attempts: (record.attempts ?? 0) + 1 },
      overrideAccess: true,
    })
    return null
  }

  await consume(payload, record.id)
  return { user: record.user, redirectTo: record.redirectTo ?? undefined }
}

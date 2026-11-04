import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Site, User } from '@/payload-types'
import { requestSignIn, verifyCode, verifyToken } from '@/lib/auth/magicLink'
import { issueSession, revokeSession, sessionCookieName } from '@/lib/auth/session'

import { createSite, createUser, run } from '../helpers/fixtures'

let payload: Payload
let site: Site
let user: User
const sent: { to: string; subject: string; text: string }[] = []

describe('magic link sign-in', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    site = await createSite(payload, 'Auth')
    user = await createUser(payload, 'Signer', [{ site: site.id, role: 'viewer' }])
    // Capture outgoing email instead of printing it.
    payload.sendEmail = (async (message: { to: string; subject: string; text: string }) => {
      sent.push(message)
      return message
    }) as never
  })

  afterAll(async () => {
    await payload.delete({
      collection: 'login-tokens',
      where: { email: { like: `-${run}@example.test` } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'users',
      where: { email: { like: `-${run}@example.test` } },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'sites',
      where: { id: { equals: site.id } },
      overrideAccess: true,
    })
    await payload.db.destroy?.()
  })

  it('does nothing for an unknown email', async () => {
    const result = await requestSignIn({
      payload,
      email: `nobody-${run}@example.test`,
      origin: 'http://test',
    })
    expect(result).toEqual({ sent: false, reason: 'unknown-user' })
    expect(sent).toHaveLength(0)
  })

  it('emails a link and a code, and the code signs in once', async () => {
    const result = await requestSignIn({
      payload,
      email: user.email.toUpperCase(),
      origin: 'http://test',
    })
    expect(result.sent).toBe(true)
    expect(sent).toHaveLength(1)
    const code = sent[0].subject.match(/\d{6}/)?.[0]
    expect(code).toBeDefined()

    expect(await verifyCode(payload, user.email, '000000')).toBeNull()
    const ok = await verifyCode(payload, user.email, code!)
    expect(ok?.user.id).toBe(user.id)
    expect(await verifyCode(payload, user.email, code!)).toBeNull()
  })

  it('the link signs in once and remembers where to go', async () => {
    await requestSignIn({
      payload,
      email: user.email,
      origin: 'http://test',
      redirectTo: '/recipes/x',
    })
    const link = sent[1].text.match(/http:\/\/test\/auth\/verify\?token=([^\s]+)/)
    expect(link).not.toBeNull()
    const token = decodeURIComponent(link![1])

    const ok = await verifyToken(payload, token)
    expect(ok?.user.id).toBe(user.id)
    expect(ok?.redirectTo).toBe('/recipes/x')
    expect(await verifyToken(payload, token)).toBeNull()
  })

  it('rate limits repeated requests', async () => {
    const results = []
    for (let i = 0; i < 6; i++) {
      results.push(await requestSignIn({ payload, email: user.email, origin: 'http://test' }))
    }
    expect(results.some((r) => r.reason === 'rate-limited')).toBe(true)
  })

  it('issues a session the auth strategy accepts, until revoked', async () => {
    const { token, sid } = await issueSession(payload, user.id)
    const headers = new Headers({ cookie: `${sessionCookieName(payload)}=${token}` })

    const before = await payload.auth({ headers })
    expect(before.user?.id).toBe(user.id)

    await revokeSession(payload, user.id, sid)
    const after = await payload.auth({ headers })
    expect(after.user).toBeNull()
  })

  it('rejects a tampered token', async () => {
    const { token } = await issueSession(payload, user.id)
    const headers = new Headers({ cookie: `${sessionCookieName(payload)}=${token.slice(0, -2)}xx` })
    const result = await payload.auth({ headers })
    expect(result.user).toBeNull()
  })
})

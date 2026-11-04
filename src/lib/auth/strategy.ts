import { jwtVerify } from 'jose'
import type { AuthStrategy, AuthStrategyResult } from 'payload'
import { JWT_AUTH_VERSION } from 'payload'

/**
 * Reads the Payload JWT from the Authorization header or the session cookie.
 * Mirrors Payload's own extractJWT, which is not exported.
 */
export function extractToken(headers: Headers, cookiePrefix: string): string | null {
  const auth = headers.get('authorization')
  if (auth?.startsWith('JWT ')) return auth.slice(4).trim()

  const cookieHeader = headers.get('cookie')
  if (!cookieHeader) return null
  const name = `${cookiePrefix}-token=`
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(name)) return decodeURIComponent(trimmed.slice(name.length))
  }
  return null
}

/**
 * Verifies the session JWT issued by the magic link flow and loads the user.
 * Payload's built-in JWT strategy refuses to run when the password strategy
 * is disabled, so this is a copy of its essentials: same signing header,
 * same claims, and the session id must still exist on the user.
 */
export const magicLinkJwtStrategy: AuthStrategy = {
  name: 'magic-link-jwt',
  authenticate: async ({ headers, payload, strategyName }): Promise<AuthStrategyResult> => {
    const token = extractToken(headers, payload.config.cookiePrefix)
    if (!token) return { user: null }

    try {
      const secretKey = new TextEncoder().encode(payload.secret)
      const { payload: claims, protectedHeader } = await jwtVerify(token, secretKey)
      if (protectedHeader.authVersion !== JWT_AUTH_VERSION) return { user: null }
      if (
        claims.collection !== 'users' ||
        typeof claims.id !== 'number' ||
        typeof claims.sid !== 'string'
      ) {
        return { user: null }
      }

      const user = await payload.findByID({
        collection: 'users',
        id: claims.id,
        depth: payload.collections.users.config.auth.depth,
        overrideAccess: true,
      })
      if (!user) return { user: null }

      const now = Date.now()
      const session = (user.sessions || []).find((s) => s.id === claims.sid)
      if (!session || new Date(session.expiresAt).getTime() < now) return { user: null }

      const authenticated = {
        ...user,
        collection: 'users',
        _strategy: strategyName,
        _sid: claims.sid,
      } as unknown as AuthStrategyResult['user']
      return { user: authenticated }
    } catch {
      return { user: null }
    }
  },
}

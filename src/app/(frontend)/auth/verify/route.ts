import { NextResponse, type NextRequest } from 'next/server'

import { verifyToken } from '@/lib/auth/magicLink'
import { issueSession, sessionCookieName, sessionCookieOptions } from '@/lib/auth/session'
import { getPayloadClient, safeRedirect } from '@/lib/request'

export const dynamic = 'force-dynamic'

/** Magic link landing. Redeems the token, sets the session cookie, sends the user on. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? ''
  const payload = await getPayloadClient()

  const verified = await verifyToken(payload, token)
  if (!verified) {
    return NextResponse.redirect(new URL('/sign-in?error=expired', request.url))
  }

  const session = await issueSession(payload, verified.user.id)
  const response = NextResponse.redirect(new URL(safeRedirect(verified.redirectTo), request.url))
  response.cookies.set(sessionCookieName(payload), session.token, sessionCookieOptions(session.exp))
  return response
}

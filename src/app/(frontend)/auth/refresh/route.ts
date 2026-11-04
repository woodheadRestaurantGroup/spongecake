import { NextResponse } from 'next/server'

import { extendSession, sessionCookieName, sessionCookieOptions } from '@/lib/auth/session'
import { getRequestContext } from '@/lib/request'

export const dynamic = 'force-dynamic'

/** Sliding renewal: reissues the session cookie for another full term. */
export async function POST() {
  const { payload, user, sid } = await getRequestContext()
  if (!user || !sid) return NextResponse.json({ ok: false }, { status: 401 })

  const session = await extendSession(payload, user.id, sid)
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })

  const response = NextResponse.json({ ok: true, exp: session.exp })
  response.cookies.set(sessionCookieName(payload), session.token, sessionCookieOptions(session.exp))
  return response
}

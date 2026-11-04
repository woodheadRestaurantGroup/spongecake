'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { normaliseEmail, requestSignIn, verifyCode } from '@/lib/auth/magicLink'
import {
  issueSession,
  revokeSession,
  sessionCookieName,
  sessionCookieOptions,
} from '@/lib/auth/session'
import { getRequestContext, safeRedirect } from '@/lib/request'

export type FormState = { error?: string; sent?: boolean }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function sendCode(email: string, redirectTo: string): Promise<FormState> {
  const { payload, origin, ip, site } = await getRequestContext()
  const result = await requestSignIn({
    payload,
    email,
    origin,
    ip,
    redirectTo,
    site: site ? { name: site.name, accent: site.accentColour ?? '#8B2D2D' } : undefined,
  })
  if (result.reason === 'rate-limited') {
    return { error: 'Too many sign-in emails just now. Wait a few minutes and try again.' }
  }
  if (result.reason === 'send-failed') {
    return { error: 'We couldn’t send the email. Try again in a moment, or tell your head chef.' }
  }
  return { sent: true }
}

export async function requestSignInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = normaliseEmail(String(formData.get('email') ?? ''))
  const redirectTo = safeRedirect(formData.get('redirect'), '/')
  if (!EMAIL_PATTERN.test(email)) return { error: 'Enter your work email address.' }

  const result = await sendCode(email, redirectTo)
  if (result.error) return result

  const params = new URLSearchParams({ email })
  if (redirectTo !== '/') params.set('redirect', redirectTo)
  redirect(`/sign-in/check?${params.toString()}`)
}

/** "Send a new code" on the check screen. Stays on the page. */
export async function resendCodeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = normaliseEmail(String(formData.get('email') ?? ''))
  const redirectTo = safeRedirect(formData.get('redirect'), '/')
  if (!EMAIL_PATTERN.test(email)) return { error: 'Enter your work email address.' }
  return sendCode(email, redirectTo)
}

export async function verifyCodeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = normaliseEmail(String(formData.get('email') ?? ''))
  const code = String(formData.get('code') ?? '')
  const fallback = safeRedirect(formData.get('redirect'), '/')

  const { payload } = await getRequestContext()
  const verified = await verifyCode(payload, email, code)
  if (!verified)
    return { error: 'That code didn’t match. Check the newest email, or send another.' }

  const session = await issueSession(payload, verified.user.id)
  const cookieStore = await cookies()
  cookieStore.set(sessionCookieName(payload), session.token, sessionCookieOptions(session.exp))

  redirect(safeRedirect(verified.redirectTo, fallback))
}

export async function signOutAction(): Promise<void> {
  const { payload, user, sid } = await getRequestContext()
  if (user && sid) await revokeSession(payload, user.id, sid)
  const cookieStore = await cookies()
  cookieStore.delete(sessionCookieName(payload))
  redirect('/sign-in')
}

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

export type FormState = { error?: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function requestSignInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = normaliseEmail(String(formData.get('email') ?? ''))
  const redirectTo = safeRedirect(formData.get('redirect'), '/')
  if (!EMAIL_PATTERN.test(email)) return { error: 'Enter your work email address.' }

  const { payload, origin, ip } = await getRequestContext()
  const result = await requestSignIn({ payload, email, origin, ip, redirectTo })
  if (result.reason === 'rate-limited') {
    return { error: 'Too many sign-in emails just now. Wait a few minutes and try again.' }
  }

  const params = new URLSearchParams({ email })
  if (redirectTo !== '/') params.set('redirect', redirectTo)
  redirect(`/sign-in/check?${params.toString()}`)
}

export async function verifyCodeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = normaliseEmail(String(formData.get('email') ?? ''))
  const code = String(formData.get('code') ?? '')
  const fallback = safeRedirect(formData.get('redirect'), '/')

  const { payload } = await getRequestContext()
  const verified = await verifyCode(payload, email, code)
  if (!verified) return { error: 'That code is not right, or it has expired. Request a new one.' }

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

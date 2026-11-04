import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import { getRequestContext, safeRedirect } from '@/lib/request'

import { SignInForm } from './SignInForm'

export const metadata: Metadata = { title: 'Sign in' }

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams
  const { user } = await getRequestContext()
  const redirectTo = safeRedirect(
    Array.isArray(query.redirect) ? query.redirect[0] : query.redirect,
    '/',
  )
  if (user) redirect(redirectTo)

  const expired = query.error === 'expired'

  return (
    <>
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-300">
        We will email you a code. No password needed.
      </p>
      {expired && (
        <p className="mt-4 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
          That link has expired or was already used. Request a new one.
        </p>
      )}
      <SignInForm redirectTo={redirectTo} />
    </>
  )
}

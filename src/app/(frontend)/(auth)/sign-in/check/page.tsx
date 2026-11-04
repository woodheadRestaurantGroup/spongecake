import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { safeRedirect } from '@/lib/request'

import { CodeForm } from './CodeForm'

export const metadata: Metadata = { title: 'Check your email' }

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function CheckPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams
  const email = Array.isArray(query.email) ? query.email[0] : query.email
  if (!email) redirect('/sign-in')
  const redirectTo = safeRedirect(
    Array.isArray(query.redirect) ? query.redirect[0] : query.redirect,
    '/',
  )

  return (
    <>
      <h1 className="text-2xl font-semibold">Check your email</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-300">
        If <span className="font-medium text-stone-900 dark:text-stone-100">{email}</span> has an
        account, a six-digit code is on its way. Type it below, or tap the link in the email on this
        device.
      </p>
      <CodeForm email={email} redirectTo={redirectTo} />
      <p className="mt-6 text-sm text-stone-500 dark:text-stone-400">
        Wrong address?{' '}
        <Link
          href={`/sign-in${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
          className="font-medium text-accent"
        >
          Start again
        </Link>
      </p>
    </>
  )
}

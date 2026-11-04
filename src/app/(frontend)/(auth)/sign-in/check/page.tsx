import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import { BackButton } from '@/components/nav/ViewTransitions'
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
  const signInHref = `/sign-in${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`

  return (
    <div
      className="flex flex-1 flex-col px-6 pb-10"
      style={{ paddingTop: 'calc(54px + env(safe-area-inset-top, 0px))' }}
    >
      <div className="-ml-2.5">
        <BackButton
          href={signInHref}
          label=""
          className="flex h-11 w-11 items-center justify-center rounded-full active:bg-surface-2"
        />
      </div>
      <h1 className="mt-7 text-[28px] font-semibold leading-[1.15] tracking-[-0.01em]">
        Check your email
      </h1>
      <p className="mt-2.5 text-[17px] leading-[1.45] text-ink-2">
        Enter the code we sent to <span className="font-semibold text-ink">{email}</span>
      </p>
      <CodeForm email={email} redirectTo={redirectTo} signInHref={signInHref} />
    </div>
  )
}

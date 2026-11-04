import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import { Notice } from '@/components/ui'
import { siteInitial } from '@/lib/recipes/queries'
import { getRequestContext, safeRedirect } from '@/lib/request'

import { SignInForm } from './SignInForm'

export const metadata: Metadata = { title: 'Sign in' }

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams
  const { user, site } = await getRequestContext()
  const redirectTo = safeRedirect(
    Array.isArray(query.redirect) ? query.redirect[0] : query.redirect,
    '/',
  )
  if (user) redirect(redirectTo)

  const expired = query.error === 'expired'
  const siteName = site?.name ?? 'Spongecake'

  return (
    <div
      className="flex flex-1 flex-col px-6 pb-12"
      style={{ paddingTop: 'calc(132px + env(safe-area-inset-top, 0px))' }}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-accent text-[30px] font-semibold text-on-accent">
        {siteInitial(siteName)}
      </span>
      <p className="mt-5 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-2">
        Spongecake
      </p>
      <h1 className="mt-1 text-[28px] font-semibold leading-[1.15] tracking-[-0.01em] text-pretty">
        {siteName}
      </h1>
      <p className="mt-10 text-[17px] leading-[1.45] text-ink-2">
        Sign in with your work email. We’ll send you a six-digit code — no password.
      </p>
      {expired && (
        <Notice className="mt-4">
          That sign-in link has expired. Enter your email for a fresh code.
        </Notice>
      )}
      <SignInForm redirectTo={redirectTo} />
      <div className="flex-1" />
      <p className="pt-8 text-center text-[14px] text-ink-2">
        Trouble signing in? Ask your head chef.
      </p>
    </div>
  )
}

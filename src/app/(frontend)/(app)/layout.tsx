import { redirect } from 'next/navigation'
import React from 'react'

import { SESSION_SECONDS } from '@/collections/Users'
import { shouldRefreshSession } from '@/lib/auth/session'
import { SessionRefresher } from '@/components/SessionRefresher'
import { SiteHeader } from '@/components/SiteHeader'
import { getRequestContext } from '@/lib/request'

import { signOutAction } from '../(auth)/actions'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getRequestContext()

  if (!ctx.site) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold">No site here</h1>
        <p className="mt-2 max-w-sm text-stone-600 dark:text-stone-300">
          Nothing is set up for <span className="font-mono">{ctx.host}</span> yet. Check the address
          or ask your group admin.
        </p>
      </main>
    )
  }

  if (!ctx.user) {
    redirect(`/sign-in?redirect=${encodeURIComponent(ctx.pathname)}`)
  }

  if (!ctx.role) {
    return (
      <main
        className="flex min-h-dvh flex-col items-center justify-center px-6 text-center"
        style={{ '--accent': ctx.site.accentColour } as React.CSSProperties}
      >
        <h1 className="text-2xl font-semibold">No access to {ctx.site.name}</h1>
        <p className="mt-2 max-w-sm text-stone-600 dark:text-stone-300">
          You are signed in as {ctx.user.email}, but you are not a member of this site. Ask a site
          admin to add you.
        </p>
        <form action={signOutAction} className="mt-6">
          <button
            type="submit"
            className="rounded-lg bg-stone-900 px-4 py-2 font-medium text-white dark:bg-stone-100 dark:text-stone-900"
          >
            Sign out
          </button>
        </form>
      </main>
    )
  }

  const needsRefresh = shouldRefreshSession(ctx.tokenExp, SESSION_SECONDS)

  return (
    <div
      className="min-h-dvh border-t-4 border-accent"
      style={{ '--accent': ctx.site.accentColour } as React.CSSProperties}
    >
      <SiteHeader site={ctx.site} user={ctx.user} role={ctx.role} />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-4">{children}</main>
      {needsRefresh && <SessionRefresher />}
    </div>
  )
}

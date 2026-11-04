import { redirect } from 'next/navigation'
import React from 'react'

import { SESSION_SECONDS } from '@/collections/Users'
import { avatarFor } from '@/components/Avatar'
import { DesktopFrame } from '@/components/desktop/DesktopFrame'
import { SessionRefresher } from '@/components/SessionRefresher'
import { Button, EmptyState } from '@/components/ui'
import { shouldRefreshSession } from '@/lib/auth/session'
import { idOf, listPublishedRecipes, listTags, siteInitial } from '@/lib/recipes/queries'
import { getRequestContext } from '@/lib/request'

import { SitePicker } from '@/components/SitePicker'

import { signOutAction } from '../(auth)/actions'
import { chooseSiteAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getRequestContext()

  if (!ctx.site) {
    if (ctx.user) {
      // A signed-in person on an address with no site (a preview URL, say) picks one of their sites.
      const memberSites = (ctx.user.memberships ?? [])
        .map((m) => (typeof m.site === 'object' ? m.site : null))
        .filter((s): s is NonNullable<typeof s> => s !== null)
      const all = ctx.isGroupAdmin
        ? (
            await ctx.payload.find({
              collection: 'sites',
              sort: 'name',
              limit: 50,
              depth: 0,
              overrideAccess: true,
            })
          ).docs
        : memberSites
      return (
        <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-6 py-12">
          <SitePicker
            sites={all.map((s) => ({
              slug: s.slug,
              name: s.name,
              accent: s.accentColour ?? '#8B2D2D',
            }))}
            host={ctx.host ?? ''}
            canAdmin={ctx.isGroupAdmin}
            action={chooseSiteAction}
          />
          <form action={signOutAction} className="mt-8 text-center">
            <button type="submit" className="text-[15px] font-semibold text-ink-2">
              Sign out
            </button>
          </form>
        </main>
      )
    }
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <EmptyState
          title="No Spongecake here"
          body="This address isn’t set up for a restaurant."
          action={
            <a
              href="/sign-in"
              className="inline-flex h-11 items-center rounded-[12px] bg-surface-2 px-[18px] text-[15px] font-semibold"
            >
              Sign in
            </a>
          }
        />
      </main>
    )
  }

  if (!ctx.user) {
    redirect(`/sign-in?redirect=${encodeURIComponent(ctx.pathname)}`)
  }

  if (!ctx.role) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <EmptyState
          title="You’re not on this site yet"
          body={`Ask the head chef at ${ctx.site.name} to add ${ctx.user.email}.`}
          action={
            <form action={signOutAction}>
              <Button variant="secondary" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          }
        />
      </main>
    )
  }

  const [recipes, tags] = await Promise.all([
    listPublishedRecipes(ctx.payload, ctx.site.id),
    listTags(ctx.payload, ctx.site.id),
  ])
  const homeTagIds = (ctx.site.homeTags ?? [])
    .map(idOf)
    .filter((id): id is number => id !== undefined)
  const needsRefresh = shouldRefreshSession(ctx.tokenExp, SESSION_SECONDS)

  return (
    <>
      <DesktopFrame
        site={{ name: ctx.site.name, initial: siteInitial(ctx.site.name) }}
        me={{ avatar: avatarFor(ctx.user.email) }}
        isEditor={ctx.role === 'editor' || ctx.role === 'siteAdmin'}
        recipes={recipes}
        tags={tags}
        homeTagIds={homeTagIds}
      >
        <div className="mx-auto w-full max-w-[640px] lg:max-w-none">{children}</div>
      </DesktopFrame>
      {needsRefresh && <SessionRefresher />}
    </>
  )
}

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

import { signOutAction } from '../(auth)/actions'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getRequestContext()

  if (!ctx.site) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <EmptyState title="No Spongecake here" body="This address isn’t set up for a restaurant." />
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

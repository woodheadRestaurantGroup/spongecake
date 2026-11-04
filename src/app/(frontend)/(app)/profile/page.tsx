import type { Metadata } from 'next'
import React from 'react'

import { Avatar, avatarFor } from '@/components/Avatar'
import { BackButton, TransitionLink } from '@/components/nav/ViewTransitions'
import { GroupedList, SectionLabel } from '@/components/ui'
import { ChevronRight } from '@/components/ui/icons'
import { ThemeToggle } from '@/components/ThemeToggle'
import { siteInitial } from '@/lib/recipes/queries'
import { getRequestContext } from '@/lib/request'

import { signOutAction } from '../../(auth)/actions'

export const metadata: Metadata = { title: 'Profile' }

const ROLE_LABEL: Record<string, string> = {
  viewer: 'Viewer',
  editor: 'Editor',
  siteAdmin: 'Site Admin',
}

export default async function ProfilePage() {
  const { user, isGroupAdmin } = await getRequestContext()
  if (!user) return null

  const sites = (user.memberships ?? []).map((m) => {
    const site = typeof m.site === 'object' ? m.site : null
    return {
      key: String(typeof m.site === 'object' ? m.site.id : m.site),
      name: site?.name ?? 'Site',
      accent: site?.accentColour ?? '#8B2D2D',
      role: ROLE_LABEL[m.role] ?? m.role,
    }
  })

  return (
    <div className="pb-12">
      <div
        className="flex h-[52px] items-center px-2 lg:hidden"
        style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <BackButton href="/" label="Recipes" />
      </div>

      <div className="flex flex-col items-center px-4 pt-4 text-center">
        <Avatar params={avatarFor(user.email)} size={72} label={user.name} />
        <h1 className="mt-3.5 text-[24px] font-semibold">{user.name}</h1>
        <p className="mt-1 text-[15px] text-ink-2">{user.email}</p>
      </div>

      <SectionLabel className="px-4 pb-2.5 pt-7">Sites</SectionLabel>
      <GroupedList className="mx-4">
        {isGroupAdmin && (
          <div className="flex min-h-[60px] items-center gap-3 px-3.5">
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] bg-ink text-[14px] font-semibold text-bg">
              ★
            </span>
            <span className="min-w-0 flex-1 truncate text-[16px] font-semibold">All sites</span>
            <span className="text-[14px] text-ink-2">Group Admin</span>
          </div>
        )}
        {sites.map((s) => (
          <div key={s.key} className="flex min-h-[60px] items-center gap-3 px-3.5">
            <span
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] text-[14px] font-semibold text-white"
              style={{ background: s.accent }}
            >
              {siteInitial(s.name)}
            </span>
            <span className="min-w-0 flex-1 truncate text-[16px] font-semibold">{s.name}</span>
            <span className="text-[14px] text-ink-2">{s.role}</span>
          </div>
        ))}
      </GroupedList>

      <SectionLabel className="px-4 pb-2.5 pt-7">Appearance</SectionLabel>
      <div className="mx-4">
        <ThemeToggle />
      </div>

      <GroupedList className="mx-4 mt-7">
        <TransitionLink
          href="/install"
          className="flex min-h-[56px] w-full items-center justify-between pl-3.5 pr-2.5 text-[16px] active:bg-surface-2"
        >
          <span>Add to Home Screen</span>
          <ChevronRight className="text-ink-3" />
        </TransitionLink>
        <TransitionLink
          href="/privacy"
          className="flex min-h-[56px] w-full items-center justify-between pl-3.5 pr-2.5 text-[16px] active:bg-surface-2"
        >
          <span>Privacy</span>
          <ChevronRight className="text-ink-3" />
        </TransitionLink>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex min-h-[56px] w-full items-center px-3.5 text-[16px] font-semibold text-danger active:bg-surface-2"
          >
            Sign out
          </button>
        </form>
      </GroupedList>

      <p className="px-4 pb-12 pt-6 text-center text-[13px] text-ink-2">
        Spongecake · Woodhead Restaurant Group
      </p>
    </div>
  )
}

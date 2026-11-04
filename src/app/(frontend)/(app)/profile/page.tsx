import type { Metadata } from 'next'
import React from 'react'

import { Avatar } from '@/components/Avatar'
import { ThemeToggle } from '@/components/ThemeToggle'
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

  const memberships = (user.memberships ?? []).map((m) => ({
    site: typeof m.site === 'object' ? m.site.name : `Site ${m.site}`,
    role: ROLE_LABEL[m.role] ?? m.role,
  }))

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <Avatar seed={user.avatarSeed ?? String(user.id)} name={user.name} size={64} />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{user.name}</h1>
          <p className="truncate text-stone-600 dark:text-stone-300">{user.email}</p>
        </div>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Sites
        </h2>
        <ul className="divide-y divide-stone-200 rounded-xl bg-white ring-1 ring-stone-200 dark:divide-stone-700 dark:bg-stone-800 dark:ring-stone-700">
          {isGroupAdmin && (
            <li className="flex justify-between px-4 py-3">
              <span>All sites</span>
              <span className="text-stone-500 dark:text-stone-400">Group Admin</span>
            </li>
          )}
          {memberships.map((m, i) => (
            <li key={i} className="flex justify-between px-4 py-3">
              <span>{m.site}</span>
              <span className="text-stone-500 dark:text-stone-400">{m.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          Appearance
        </h2>
        <ThemeToggle />
      </section>

      <form action={signOutAction}>
        <button
          type="submit"
          className="w-full rounded-xl border border-stone-300 py-3 font-medium text-stone-700 dark:border-stone-700 dark:text-stone-200"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}

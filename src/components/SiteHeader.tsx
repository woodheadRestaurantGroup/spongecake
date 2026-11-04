import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import type { Role } from '@/access/roles'
import { imageUrl } from '@/lib/recipes/queries'
import type { Site, User } from '@/payload-types'

import { Avatar } from './Avatar'

export function SiteHeader({ site, user, role }: { site: Site; user: User; role: Role }) {
  const logo = imageUrl(site.logo, 'thumbnail')
  const canEdit = role === 'editor' || role === 'siteAdmin'

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/90 backdrop-blur dark:border-stone-800 dark:bg-stone-900/90">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" prefetch>
          {logo ? (
            <Image
              src={logo}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-md object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-sm font-bold text-white">
              {site.name.charAt(0)}
            </span>
          )}
          <span className="truncate text-base font-semibold">{site.name}</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {canEdit && (
            <Link
              href="/admin"
              prefetch={false}
              className="rounded-full border border-stone-300 px-3 py-1 text-sm font-medium text-stone-700 dark:border-stone-700 dark:text-stone-200"
            >
              Admin
            </Link>
          )}
          <Link href="/profile" aria-label="Your profile" prefetch>
            <Avatar seed={user.avatarSeed ?? String(user.id)} name={user.name} size={32} />
          </Link>
        </div>
      </div>
    </header>
  )
}

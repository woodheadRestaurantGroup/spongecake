import Image from 'next/image'
import React from 'react'

import { imageUrl } from '@/lib/recipes/queries'
import { getRequestContext } from '@/lib/request'

export const dynamic = 'force-dynamic'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { site } = await getRequestContext()
  const logo = imageUrl(site?.logo, 'thumbnail')
  const accent = site?.accentColour ?? '#b45309'

  return (
    <div
      className="flex min-h-dvh flex-col border-t-4 border-accent"
      style={{ '--accent': accent } as React.CSSProperties}
    >
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          {logo ? (
            <Image
              src={logo}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-lg font-bold text-white">
              {(site?.name ?? 'S').charAt(0)}
            </span>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-stone-500 dark:text-stone-400">
              Spongecake
            </p>
            <p className="text-lg font-semibold leading-tight">{site?.name ?? 'Recipe database'}</p>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}

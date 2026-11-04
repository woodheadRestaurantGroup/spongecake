import React from 'react'

import { GroupedList, SectionLabel } from '@/components/ui'
import Link from 'next/link'

import { ChevronRight } from '@/components/ui/icons'
import { siteInitial } from '@/lib/recipes/queries'

type SiteOption = { slug: string; name: string; accent: string }

/** Shown when the address matches no site domain. Lets a signed-in user choose which site to use here. */
export function SitePicker({
  sites,
  host,
  canAdmin,
  action,
}: {
  sites: SiteOption[]
  host: string
  canAdmin: boolean
  action: (formData: FormData) => Promise<void>
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-2">Spongecake</p>
      <h1 className="mt-1 text-[28px] font-semibold leading-[1.15] tracking-[-0.01em]">
        Which site?
      </h1>
      <p className="mt-2.5 text-[17px] leading-[1.45] text-ink-2">
        This address isn’t tied to a restaurant, so pick the one you want. Your choice is remembered
        on this device.
      </p>
      {sites.length > 0 ? (
        <>
          <SectionLabel className="pb-2.5 pt-7">Your sites</SectionLabel>
          <GroupedList>
            {sites.map((s) => (
              <form key={s.slug} action={action}>
                <input type="hidden" name="slug" value={s.slug} />
                <button
                  type="submit"
                  className="flex min-h-[60px] w-full items-center gap-3 pl-3.5 pr-2.5 text-left active:bg-surface-2"
                >
                  <span
                    className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] text-[14px] font-semibold text-white"
                    style={{ background: s.accent }}
                  >
                    {siteInitial(s.name)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[16px] font-semibold">
                    {s.name}
                  </span>
                  <ChevronRight className="text-ink-3" />
                </button>
              </form>
            ))}
          </GroupedList>
        </>
      ) : (
        <p className="mt-6 text-[16px] text-ink-2">
          You aren’t a member of any site yet. Ask your head chef to add you.
        </p>
      )}
      {canAdmin && (
        <p className="mt-7 text-[14px] leading-[1.5] text-ink-2">
          To make this address open a site directly, add{' '}
          <span className="font-mono text-ink">{host}</span> to that site’s domains in{' '}
          <Link
            href="/admin/collections/sites"
            prefetch={false}
            className="font-semibold text-ink underline underline-offset-2"
          >
            Admin → Sites
          </Link>
          .
        </p>
      )}
    </div>
  )
}

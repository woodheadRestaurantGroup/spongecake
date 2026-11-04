import type { Metadata } from 'next'
import React from 'react'

import { BackButton } from '@/components/nav/ViewTransitions'

export const metadata: Metadata = { title: 'Add to Home Screen' }

const STEPS = [
  [
    'Open Spongecake in Safari',
    'If you are reading this inside another app, tap the link again so it opens in Safari.',
  ],
  ['Tap the Share button', 'It is the square with an arrow at the bottom of the screen.'],
  [
    'Choose “Add to Home Screen”',
    'Scroll the sheet down a little if you don’t see it, then tap Add.',
  ],
  [
    'Open Spongecake from its icon',
    'It works like an app, stays signed in, and keeps the recipes you have opened.',
  ],
]

export default function InstallPage() {
  return (
    <div className="pb-12">
      <div
        className="flex h-[52px] items-center px-2 lg:hidden"
        style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <BackButton href="/profile" label="Profile" />
      </div>
      <div className="px-4 pt-4">
        <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.01em]">
          Put it on your home screen
        </h1>
        <p className="mt-2.5 text-[17px] leading-[1.45] text-ink-2">
          On an iPhone, takes about ten seconds.
        </p>
        <ol className="mt-7 flex flex-col gap-3">
          {STEPS.map(([title, body], i) => (
            <li
              key={title}
              className="flex gap-3.5 rounded-[14px] border border-line bg-surface p-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line text-[15px] font-semibold text-ink-2 tabular">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-[17px] font-semibold leading-[1.3]">{title}</span>
                <span className="mt-1 block text-[15px] leading-[1.45] text-ink-2">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

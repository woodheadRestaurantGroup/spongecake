import type { Metadata } from 'next'
import React from 'react'

import { BackButton } from '@/components/nav/ViewTransitions'

export const metadata: Metadata = { title: 'Privacy' }

const SECTIONS: [string, string][] = [
  [
    'What we hold',
    'Your name, your work email address, which sites you belong to and your role there, the recipes you mark as favourites, and the recipes and suggestions you write or edit, with your name and the time. On your own phone only, the app also keeps which recipes you opened recently and your light or dark preference.',
  ],
  [
    'Why',
    'To let you sign in, to show who wrote or changed a recipe, and to run the app. We use it for nothing else. We don’t track where you are or how often you use it, and we don’t share it outside the group.',
  ],
  [
    'Sign-in emails',
    'They are sent through Resend on our behalf. Your email address is used only to send the code.',
  ],
  ['Where it lives', 'On servers in London, with Vercel and Neon.'],
  [
    'How long',
    'While you work for the group. When you leave, your account is removed. Your name stays on recipes you wrote or changed so the kitchen knows where they came from.',
  ],
  [
    'Your rights',
    'You can see what we hold by opening your profile. Ask James if you want anything corrected or removed.',
  ],
]

export default function PrivacyPage() {
  return (
    <div className="pb-12">
      <div
        className="flex h-[52px] items-center px-2 lg:hidden"
        style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <BackButton href="/profile" label="Profile" />
      </div>
      <div className="px-4 pt-4">
        <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.01em]">Privacy</h1>
        <p className="mt-2.5 text-[17px] leading-[1.45] text-ink-2">
          Spongecake is Woodhead Restaurant Group’s internal recipe app. This is what it stores
          about you.
        </p>
        <dl className="mt-7 flex flex-col gap-5">
          {SECTIONS.map(([title, body]) => (
            <div key={title}>
              <dt className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-2">
                {title}
              </dt>
              <dd className="mt-1.5 text-[16px] leading-[1.5]">{body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

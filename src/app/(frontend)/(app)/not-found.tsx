import React from 'react'

import { TransitionLink } from '@/components/nav/ViewTransitions'
import { EmptyState } from '@/components/ui'

export default function NotFound() {
  return (
    <EmptyState
      title="Recipe not found"
      body="It may have been unpublished or renamed."
      action={
        <TransitionLink
          href="/"
          direction="pop"
          className="inline-flex h-11 items-center rounded-[12px] bg-surface-2 px-[18px] text-[15px] font-semibold"
        >
          Back to recipes
        </TransitionLink>
      }
    />
  )
}

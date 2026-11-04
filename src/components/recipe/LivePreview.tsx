'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import React from 'react'

/** Inside the Payload admin live preview iframe, re-render on every save. */
export function LivePreview({ serverURL }: { serverURL: string }) {
  const router = useRouter()
  return <RefreshRouteOnSave serverURL={serverURL} refresh={() => router.refresh()} />
}

'use client'

import { useEffect } from 'react'

/** Fires once per page load when the session is past its midpoint, extending it silently. */
export function SessionRefresher() {
  useEffect(() => {
    fetch('/auth/refresh', { method: 'POST', credentials: 'same-origin' }).catch(() => {})
  }, [])
  return null
}

'use client'

import { useEffect } from 'react'

/** Installs the service worker in production builds. Admin, auth and API paths are left alone by the worker. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
  }, [])
  return null
}

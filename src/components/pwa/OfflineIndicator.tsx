'use client'

import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
}

/** Quiet pill shown while the device is offline. No accent, no red. */
export function OfflineIndicator({ className }: { className?: string }) {
  const online = useOnline()
  if (online) return null
  return (
    <div className={className ?? 'flex justify-center px-4 pb-1 pt-2'}>
      <span
        className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-[13px] font-semibold text-ink-2"
        role="status"
      >
        <span className="h-[7px] w-[7px] rounded-full bg-ink-3" aria-hidden />
        Offline · showing saved copy
      </span>
    </div>
  )
}

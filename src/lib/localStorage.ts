'use client'

import { useSyncExternalStore } from 'react'

const CHANGE_EVENT = 'spongecake:storage'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}

/**
 * Reads a localStorage key as React state. Null on the server and in private
 * modes where storage throws, so callers always need a sensible default.
 */
export function useLocalStorageValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    () => null,
  )
}

export function writeLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

'use client'

import React, { useEffect, useRef } from 'react'

import { cx } from './index'

/**
 * Slide-up sheet with a scrim. Rendered always, animated with transforms so
 * open and close both run at 300ms on the iOS curve.
 */
export function BottomSheet({
  open,
  onClose,
  height = '72%',
  children,
  className,
  label,
}: {
  open: boolean
  onClose: () => void
  height?: string
  children: React.ReactNode
  className?: string
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={cx(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-[220ms]',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-hidden={!open}
        className={cx(
          'fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[28px] bg-surface transition-transform duration-[300ms] ease-ios',
          open ? 'translate-y-0' : 'pointer-events-none translate-y-[105%]',
          className,
        )}
        style={{ height, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-7 shrink-0 items-center justify-center"
        >
          <span className="h-[5px] w-10 rounded-[3px] bg-line" />
        </button>
        {children}
      </div>
    </>
  )
}

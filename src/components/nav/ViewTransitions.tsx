'use client'

import { usePathname, useRouter } from 'next/navigation'
import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react'

type Direction = 'push' | 'pop'

type Nav = {
  push: (href: string) => void
  back: (fallback?: string) => void
}

const NavContext = createContext<Nav | null>(null)

function reducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Wraps App Router navigations in the View Transitions API so screens push
 * and pop like a native stack. The direction is written to <html data-nav>
 * for the CSS in globals.css. Falls back to a plain navigation where the
 * API is missing or motion is reduced.
 */
export function ViewTransitionsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const pending = useRef<(() => void) | null>(null)

  // Resolve the in-flight transition once the new route has rendered.
  useEffect(() => {
    if (pending.current) {
      pending.current()
      pending.current = null
    }
  }, [pathname])

  const run = useCallback((direction: Direction, navigate: () => void) => {
    const doc = document as Document & {
      startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> }
    }
    if (!doc.startViewTransition || reducedMotion()) {
      navigate()
      return
    }
    document.documentElement.dataset.nav = direction
    const transition = doc.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          pending.current = resolve
          startTransition(navigate)
          // Safety net so a failed navigation never leaves the page frozen.
          setTimeout(resolve, 1500)
        }),
    )
    transition.finished.finally(() => {
      delete document.documentElement.dataset.nav
    })
  }, [])

  const nav: Nav = {
    push: (href) => run('push', () => router.push(href)),
    back: (fallback = '/') =>
      run('pop', () => {
        // Pages opened straight from a link (an email, a share) have nowhere to go back to.
        if (window.history.length > 1) router.back()
        else router.push(fallback)
      }),
  }

  return <NavContext.Provider value={nav}>{children}</NavContext.Provider>
}

export function useNav(): Nav {
  const nav = useContext(NavContext)
  if (!nav) throw new Error('useNav must be used inside ViewTransitionsProvider')
  return nav
}

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  direction?: Direction
}

/** An anchor that navigates with a push (or pop) transition. Prefetches like next/link on hover and touch. */
export function TransitionLink({
  href,
  direction = 'push',
  onClick,
  children,
  ...rest
}: LinkProps) {
  const nav = useNav()
  const router = useRouter()
  const prefetch = () => router.prefetch(href)
  return (
    <a
      href={href}
      {...rest}
      onMouseEnter={prefetch}
      onTouchStart={prefetch}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        if (direction === 'pop') nav.back(href)
        else nav.push(href)
      }}
    >
      {children}
    </a>
  )
}

/** A back button that pops with a transition, falling back to `href` when there is no history. */
export function BackButton({
  href,
  label,
  className,
}: {
  href: string
  label: string
  className?: string
}) {
  const nav = useNav()
  return (
    <button
      type="button"
      onClick={() => nav.back(href)}
      className={
        className ??
        'flex h-11 items-center gap-0.5 rounded-[12px] pl-1 pr-2.5 text-[17px] active:bg-surface-2'
      }
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polyline points="15 5 8 12 15 19" />
      </svg>
      <span>{label}</span>
    </button>
  )
}

import React from 'react'

import { ChevronRight } from './icons'

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/* ---------- Text roles ---------- */

/** 13/600 uppercase tracked label, used for section headings in lists and above ingredient groups. */
export function SectionLabel({
  children,
  count,
  className,
}: {
  children: React.ReactNode
  count?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cx(
        'flex items-baseline justify-between text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-2',
        className,
      )}
    >
      <span>{children}</span>
      {count !== undefined && (
        <span className="text-[14px] font-normal normal-case tracking-normal">{count}</span>
      )}
    </div>
  )
}

export function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full bg-surface-2 px-2.5 text-[13px] font-semibold text-ink-2">
      {children}
    </span>
  )
}

export function DraftBadge() {
  return (
    <span className="inline-flex h-[26px] items-center rounded-full border-[1.5px] border-dashed border-ink-3 px-2.5 text-[12px] font-semibold uppercase tracking-[0.06em]">
      Draft
    </span>
  )
}

/* ---------- Buttons ---------- */

type Variant = 'primary' | 'secondary' | 'soft' | 'text' | 'danger'

const variantClass: Record<Variant, string> = {
  primary: 'bg-ink text-bg',
  secondary: 'border-[1.5px] border-line bg-transparent text-ink active:bg-surface-2',
  soft: 'bg-surface-2 text-ink active:opacity-70',
  text: 'bg-transparent text-ink active:bg-surface-2',
  danger: 'bg-transparent text-danger active:bg-surface-2',
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'lg' | 'md' | 'sm'
  full?: boolean
}

const sizeClass = {
  lg: 'h-14 rounded-[14px] px-5 text-[18px]',
  md: 'h-[52px] rounded-[14px] px-4 text-[16px]',
  sm: 'h-11 rounded-[12px] px-4 text-[15px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  full,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'inline-flex select-none items-center justify-center gap-2 font-semibold transition-transform duration-[90ms] ease-ios active:scale-[0.98] disabled:opacity-60',
        sizeClass[size],
        variantClass[variant],
        full && 'w-full',
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ---------- Grouped list ---------- */

export function GroupedList({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cx(
        'divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** A full-width tappable row inside a GroupedList. */
export function ListRow({
  children,
  chevron = true,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { chevron?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'flex min-h-[56px] w-full items-center gap-3 py-3 pl-3.5 pr-2 text-left active:bg-surface-2',
        className,
      )}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {chevron && <ChevronRight className="shrink-0 text-ink-3" />}
    </button>
  )
}

/* ---------- Forms ---------- */

export function Field({
  label,
  children,
  className,
}: {
  label: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cx('block', className)}>
      <span className="block text-[15px] font-semibold">{label}</span>
      <span className="mt-2 block">{children}</span>
    </label>
  )
}

export const inputClass =
  'h-14 w-full rounded-[14px] border-[1.5px] border-line bg-surface px-4 text-[18px] outline-none transition-colors duration-[120ms] focus:border-ink'

export function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[15px] font-semibold leading-[1.4] text-danger">{children}</p>
}

/** Quiet inline notice with an accent dot, e.g. an expired sign-in link. */
export function Notice({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        'flex gap-2.5 rounded-[12px] bg-surface-2 px-3.5 py-3 text-[15px] leading-[1.4]',
        className,
      )}
    >
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
      <span>{children}</span>
    </div>
  )
}

/* ---------- Empty / error state ---------- */

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: React.ReactNode
  body?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cx('px-8 py-14 text-center', className)}>
      <h2 className="text-[20px] font-semibold leading-tight">{title}</h2>
      {body && <p className="mt-2 text-[16px] leading-[1.45] text-ink-2">{body}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

/* ---------- Sticky bottom bar ---------- */

export function BottomBar({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cx('sticky bottom-0 z-10 border-t border-line bg-bg px-4 pt-3', className)}
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
    >
      {children}
    </div>
  )
}

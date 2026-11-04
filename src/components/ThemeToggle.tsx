'use client'

import { useLocalStorageValue, writeLocalStorage } from '@/lib/localStorage'

type Theme = 'light' | 'dark' | 'system'

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function applyTheme(theme: Theme) {
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

/** Segmented control: track p4 r14 surface-2, segments h44 r10, active surface with a 1px line ring. */
export function ThemeToggle() {
  const stored = useLocalStorageValue('theme')
  const theme: Theme = isTheme(stored) ? stored : 'system'

  function choose(next: Theme) {
    writeLocalStorage('theme', next)
    applyTheme(next)
  }

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="grid grid-cols-3 gap-1 rounded-[14px] bg-surface-2 p-1"
    >
      {OPTIONS.map((o) => {
        const active = theme === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(o.value)}
            className={`h-11 rounded-[10px] text-[15px] font-semibold transition-colors duration-[140ms] ${
              active ? 'bg-surface text-ink shadow-[0_0_0_1px_var(--color-line)]' : 'text-ink-2'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

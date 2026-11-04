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
      className="inline-flex rounded-lg border border-stone-300 p-0.5 dark:border-stone-700"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={theme === o.value}
          onClick={() => choose(o.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            theme === o.value
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
              : 'text-stone-600 dark:text-stone-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

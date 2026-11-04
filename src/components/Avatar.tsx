import React from 'react'

const PALETTE = [
  '#b45309',
  '#0f766e',
  '#1d4ed8',
  '#7e22ce',
  '#be123c',
  '#4d7c0f',
  '#0e7490',
  '#a16207',
]

function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Deterministic avatar from the user's seed. Phase 3 replaces the fill with
 * abstract shapes; the colour and initials carry over so avatars stay stable.
 */
export function Avatar({ seed, name, size = 32 }: { seed: string; name: string; size?: number }) {
  const colour = PALETTE[hash(seed) % PALETTE.length]
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: colour, fontSize: Math.round(size * 0.4) }}
    >
      {initials(name)}
    </span>
  )
}

// Spongecake generated avatar — stable per user forever. Seed with the user's email
// (lower-cased) or immutable user id. Renders a circle with a circle + rotated rounded
// square, from a fixed 7-colour palette. Works on both themes and beside any accent.
// Sizes used: 16, 18, 24, 34/36, 64/72 px.

export const AVATAR_PALETTE = [
  '#1F4E5A',
  '#3E8E7E',
  '#E3B448',
  '#E07A3F',
  '#B8443A',
  '#A9BFB4',
  '#6B5B95',
] as const

export function avatarParams(seed: string) {
  let h = 2166136261 // FNV-1a 32-bit
  for (const ch of seed) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  h >>>= 0
  const n = AVATAR_PALETTE.length
  const pick = (shift: number, exclude: number[]) => {
    let i = (h >>> shift) % n
    while (exclude.includes(i)) i = (i + 1) % n
    return i
  }
  const a = pick(0, []),
    b = pick(4, [a]),
    c = pick(9, [a, b])
  return {
    bg: AVATAR_PALETTE[a],
    c1: AVATAR_PALETTE[b],
    c2: AVATAR_PALETTE[c],
    x1: ((h >>> 12) % 50) - 25,
    y1: ((h >>> 15) % 50) - 25, // % offsets of circle (70% size)
    x2: 30 + ((h >>> 18) % 40),
    y2: 30 + ((h >>> 21) % 40), // % offsets of square (55% size)
    rot: (h >>> 24) % 90, // deg
  }
}

/** SVG string in a 100×100 viewBox. Use as inline SVG; set width/height to the display size. */
export function avatarSvg(seed: string, size = 24, title?: string) {
  const p = avatarParams(seed)
  const r1 = 35,
    s2 = 55
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img"${title ? ` aria-label="${title}"` : ' aria-hidden="true"'}>
<clipPath id="av-${p.bg.slice(1)}${p.rot}"><circle cx="50" cy="50" r="50"/></clipPath>
<g clip-path="url(#av-${p.bg.slice(1)}${p.rot})">
<rect width="100" height="100" fill="${p.bg}"/>
<circle cx="${p.x1 + r1}" cy="${p.y1 + r1}" r="${r1}" fill="${p.c1}"/>
<rect x="${p.x2}" y="${p.y2}" width="${s2}" height="${s2}" rx="${s2 * 0.18}" fill="${p.c2}" transform="rotate(${p.rot} ${p.x2 + s2 / 2} ${p.y2 + s2 / 2})"/>
</g></svg>`
}

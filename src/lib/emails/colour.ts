/**
 * Colour helpers for emails, where CSS color-mix() is not available.
 * Reproduces `color-mix(in oklch, accent 60%, white)` for the dark theme.
 */

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.trim().replace('#', '')
  const full =
    m.length === 3
      ? m
          .split('')
          .map((c) => c + c)
          .join('')
      : m
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function srgbToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  return Math.max(0, Math.min(255, Math.round(c * 255)))
}

type Oklab = [number, number, number]

function rgbToOklab([r8, g8, b8]: [number, number, number]): Oklab {
  const r = srgbToLinear(r8)
  const g = srgbToLinear(g8)
  const b = srgbToLinear(b8)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklabToRgb([L, a, b]: Oklab): [number, number, number] {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3)
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3)
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3)
  return [
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

/** Mixes in OKLCH by converting both to OKLab and interpolating hue-aware via polar coordinates. */
export function mixOklch(hexA: string, hexB: string, weightA: number): string {
  const [La, aa, ba] = rgbToOklab(hexToRgb(hexA))
  const [Lb, ab, bb] = rgbToOklab(hexToRgb(hexB))
  const Ca = Math.hypot(aa, ba)
  const Cb = Math.hypot(ab, bb)
  const Ha = Math.atan2(ba, aa)
  // White has no hue; keep the accent's hue, as CSS does for achromatic colours.
  const H = Cb < 1e-4 ? Ha : Ha
  const wB = 1 - weightA
  const L = La * weightA + Lb * wB
  const C = Ca * weightA + Cb * wB
  const [r, g, b] = oklabToRgb([L, C * Math.cos(H), C * Math.sin(H)])
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

/** The accent as shown on a dark background: `color-mix(in oklch, accent 60%, white)`. */
export function darkAccent(accentHex: string): string {
  return mixOklch(accentHex, '#ffffff', 0.6)
}

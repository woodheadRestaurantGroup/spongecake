import { describe, expect, it } from 'vitest'

import { darkAccent } from './colour'

// Expected values were read back from Chromium for `color-mix(in oklch, accent 60%, white)`.
describe('darkAccent', () => {
  it('matches the browser mix for the site accents', () => {
    expect(darkAccent('#8B2D2D')).toBe('#be817c')
    expect(darkAccent('#2F5D50')).toBe('#7f9b92')
    expect(darkAccent('#B45309')).toBe('#d69878')
  })
})

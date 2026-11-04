import { describe, expect, it } from 'vitest'

import { normaliseHost } from './site'

describe('normaliseHost', () => {
  it('lowercases and strips the port', () => {
    expect(normaliseHost('Spongecake.TheQualityChopHouse.com:443')).toBe(
      'spongecake.thequalitychophouse.com',
    )
    expect(normaliseHost('localhost:3000')).toBe('localhost')
  })
  it('returns null for empty values', () => {
    expect(normaliseHost(null)).toBeNull()
    expect(normaliseHost('')).toBeNull()
  })
})

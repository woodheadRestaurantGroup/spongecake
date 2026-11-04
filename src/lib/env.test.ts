import { describe, expect, it } from 'vitest'

import { parseEmailFrom } from './env'

describe('parseEmailFrom', () => {
  it('parses "Name <address>"', () => {
    expect(parseEmailFrom('Spongecake <spongecake@send.example.com>')).toEqual({
      name: 'Spongecake',
      address: 'spongecake@send.example.com',
    })
  })

  it('parses a quoted name', () => {
    expect(parseEmailFrom('"QCH Kitchen" <kitchen@example.com>')).toEqual({
      name: 'QCH Kitchen',
      address: 'kitchen@example.com',
    })
  })

  it('accepts a bare address', () => {
    expect(parseEmailFrom('kitchen@example.com')).toEqual({
      name: 'Spongecake',
      address: 'kitchen@example.com',
    })
  })

  it('falls back when unset', () => {
    expect(parseEmailFrom(undefined).address).toContain('@')
  })
})

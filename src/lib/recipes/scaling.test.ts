import { describe, expect, it } from 'vitest'

import { formatIngredientQuantity, formatQuantity, parseYieldParam, scaleFactor } from './scaling'

describe('scaleFactor', () => {
  it('doubles when the target is twice the base', () => {
    expect(scaleFactor(4, 8)).toBe(2)
  })
  it('falls back to 1 for invalid yields', () => {
    expect(scaleFactor(0, 8)).toBe(1)
    expect(scaleFactor(4, -1)).toBe(1)
  })
})

describe('formatQuantity', () => {
  it('trims trailing zeros', () => {
    expect(formatQuantity(2.5)).toBe('2.5')
    expect(formatQuantity(2)).toBe('2')
  })
  it('keeps at most two decimals without rounding to whole units', () => {
    expect(formatQuantity(1 / 3)).toBe('0.33')
    expect(formatQuantity(1.5)).toBe('1.5')
  })
  it('groups thousands', () => {
    expect(formatQuantity(1200)).toBe('1,200')
  })
})

describe('formatIngredientQuantity', () => {
  it('scales and appends the unit', () => {
    expect(formatIngredientQuantity({ quantity: 250, unit: 'g' }, 2)).toBe('500 g')
  })
  it('leaves non-scaling items alone', () => {
    expect(formatIngredientQuantity({ quantity: 1, unit: 'pinch', scales: false }, 3)).toBe(
      '1 pinch',
    )
  })
  it('omits the unit for each and none', () => {
    expect(formatIngredientQuantity({ quantity: 3, unit: 'each' }, 1)).toBe('3')
    expect(formatIngredientQuantity({ quantity: 2, unit: 'none' }, 1)).toBe('2')
  })
  it('uses the custom label for other', () => {
    expect(formatIngredientQuantity({ quantity: 1, unit: 'other', unitLabel: 'tray' }, 2)).toBe(
      '2 tray',
    )
  })
  it('returns empty when there is no quantity', () => {
    expect(formatIngredientQuantity({ quantity: null, unit: 'g' }, 2)).toBe('')
  })
})

describe('parseYieldParam', () => {
  it('accepts positive numbers and rejects junk', () => {
    expect(parseYieldParam('12')).toBe(12)
    expect(parseYieldParam('2.456')).toBe(2.46)
    expect(parseYieldParam('0')).toBeUndefined()
    expect(parseYieldParam('abc')).toBeUndefined()
    expect(parseYieldParam(undefined)).toBeUndefined()
  })
})

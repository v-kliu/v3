import { describe, expect, it } from 'vitest'
import { decide, toggleTrailingBlank, utcDaysBetween, MAX_EMPTY_DAYS } from '../../scripts/daily-pulse.mjs'

describe('daily pulse', () => {
  it('skips when main already has a commit today', () => {
    expect(decide(0, 0)).toBe('skip-today')
  })

  it('commits or skips randomly within the allowed gap', () => {
    expect(decide(1, 0.1)).toBe('random-commit')
    expect(decide(1, 0.99)).toBe('random-skip')
  })

  it('never allows more than MAX_EMPTY_DAYS empty days in a row', () => {
    // Last commit MAX_EMPTY_DAYS + 1 days ago => MAX_EMPTY_DAYS empty days already.
    expect(decide(MAX_EMPTY_DAYS + 1, 0.99)).toBe('force')
    expect(decide(30, 0.99)).toBe('force')
    expect(decide(MAX_EMPTY_DAYS, 0.99)).toBe('random-skip')
  })

  it('toggles a trailing blank line back and forth', () => {
    const once = toggleTrailingBlank('# Title\n')
    expect(once).toBe('# Title\n\n')
    expect(toggleTrailingBlank(once)).toBe('# Title\n')
    expect(toggleTrailingBlank('# Title  \n\n\n')).toBe('# Title\n')
    expect(toggleTrailingBlank('# Title')).toBe('# Title\n')
  })

  it('counts UTC calendar days, not 24h windows', () => {
    expect(utcDaysBetween(new Date('2026-11-24T23:59:00Z'), new Date('2026-11-25T00:01:00Z'))).toBe(1)
    expect(utcDaysBetween(new Date('2026-11-24T00:01:00Z'), new Date('2026-11-24T23:59:00Z'))).toBe(0)
  })
})

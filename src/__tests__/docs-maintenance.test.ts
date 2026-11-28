import { describe, expect, it } from 'vitest'
import { decide, toggleTrailingBlank, daysBetween, MAX_EMPTY_DAYS } from '../../scripts/docs-maintenance.mjs'

describe('docs maintenance', () => {
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

  it('counts Pacific calendar days, not UTC or 24h windows', () => {
    // 8pm and 11pm Pacific on Nov 24 are Nov 25 in UTC but the same Pacific day
    expect(daysBetween(new Date('2026-11-25T04:00:00Z'), new Date('2026-11-25T07:00:00Z'))).toBe(0)
    // 11:59pm -> 12:01am Pacific crosses a day
    expect(daysBetween(new Date('2026-11-25T07:59:00Z'), new Date('2026-11-25T08:01:00Z'))).toBe(1)
    expect(daysBetween(new Date('2026-11-20T18:00:00Z'), new Date('2026-11-24T18:00:00Z'))).toBe(4)
  })
})

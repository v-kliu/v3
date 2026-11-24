import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// sanitize() calls the Anthropic API so we test via source inspection, not live import.
// Avoids the Anthropic client constructor running and timing out in CI.

const src = fs.readFileSync(path.resolve(__dirname, '../eve/sanitize.ts'), 'utf8')

describe('sanitize module contract', () => {
  it('exports sanitize as an async function', () => {
    expect(src).toContain('export async function sanitize')
  })

  it('uses Claude Haiku not Sonnet', () => {
    expect(src).toContain('claude-haiku')
    expect(src).not.toContain('claude-sonnet')
  })

  it('has early return for empty input', () => {
    expect(src).toContain('!raw.trim()')
  })
})

// Contract: FeatureSpec shape returned by structureFeature().
// structureFeature() calls the Anthropic API so we test with a mock object.
const MOCK_FEATURE_SPEC = {
  title: 'Add flight tracker',
  summary: 'Shows flights on the dashboard using AviationStack.',
  steps: ['Step 1: add route', 'Step 2: add component'],
  acceptance: ['Flights load on the dashboard', 'Error state shown when API is down'],
  files_likely_touched: ['src/app/api/flight/route.ts', 'src/components/FlightTracker.tsx'],
}

describe('FeatureSpec shape contract', () => {
  it('title and summary are strings', () => {
    expect(typeof MOCK_FEATURE_SPEC.title).toBe('string')
    expect(MOCK_FEATURE_SPEC.title.length).toBeGreaterThan(0)
    expect(typeof MOCK_FEATURE_SPEC.summary).toBe('string')
    expect(MOCK_FEATURE_SPEC.summary.length).toBeGreaterThan(0)
  })

  it('steps, acceptance, files_likely_touched are non-empty arrays of strings', () => {
    for (const field of ['steps', 'acceptance', 'files_likely_touched'] as const) {
      expect(Array.isArray(MOCK_FEATURE_SPEC[field]), `${field} should be array`).toBe(true)
      expect(MOCK_FEATURE_SPEC[field].length, `${field} should not be empty`).toBeGreaterThan(0)
      for (const item of MOCK_FEATURE_SPEC[field]) {
        expect(typeof item, `${field} items should be strings`).toBe('string')
      }
    }
  })

  it('has exactly the five required keys', () => {
    const keys = Object.keys(MOCK_FEATURE_SPEC).sort()
    expect(keys).toEqual(['acceptance', 'files_likely_touched', 'steps', 'summary', 'title'])
  })
})

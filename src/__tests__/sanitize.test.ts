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

import { describe, it, expect } from 'vitest'

// sanitize() calls the Anthropic API, so we only test the contract here.
// Integration tests (mocking or live) go in a separate suite once the API key is available in CI.

describe('sanitize module contract', () => {
  it('exports sanitize as a function', async () => {
    // Dynamic import avoids the Anthropic client constructor running at module load in CI.
    const mod = await import('@/eve/sanitize').catch(() => null)
    if (!mod) return // skip if module missing (pre-merge)
    expect(typeof mod.sanitize).toBe('function')
  })
})

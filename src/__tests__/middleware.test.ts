import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// Reads the middleware source and asserts routes that must be public are listed.
// If /api/eve/telegram is accidentally removed from PUBLIC_API, Telegram's
// webhook requests get a 401 and all messages are silently dropped.

const middlewareSrc = fs.readFileSync(
  path.resolve(__dirname, '../middleware.ts'),
  'utf8'
)

describe('middleware PUBLIC_API', () => {
  it('contains /api/eve/telegram', () => {
    expect(middlewareSrc).toContain('/api/eve/telegram')
  })

  it('contains /api/auth/login', () => {
    expect(middlewareSrc).toContain('/api/auth/login')
  })

  it('contains /api/visit', () => {
    expect(middlewareSrc).toContain('/api/visit')
  })

  it('PUBLIC_API is defined as a Set', () => {
    expect(middlewareSrc).toContain('new Set(')
  })

  it('matcher covers both /dashboard and /api paths', () => {
    expect(middlewareSrc).toContain('/dashboard/:path*')
    expect(middlewareSrc).toContain('/api/:path*')
  })
})

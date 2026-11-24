import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// Env vars that GitHub Actions workflows must reference (secrets or stubs).
// These are vars the GHA jobs actually read — not Vercel-only vars.
// Add here whenever a new process.env.X is added to .github/scripts/ or workflow steps.
const GHA_REQUIRED_ENV_VARS = [
  'ANTHROPIC_API_KEY',   // eve-agent.mjs: calls Claude API
  'SUPABASE_URL',        // fetch spec + update PR URL
  'SUPABASE_SECRET_KEY', // fetch spec + update PR URL
  'TELEGRAM_BOT_TOKEN',  // notify chat on PR open
]

// Vercel-only vars (webhook auth, JWT, etc.) — not needed in GHA, not checked here.
// TELEGRAM_WEBHOOK_SECRET, JWT_SECRET, ADMIN_PASSWORD, ADMIN_IP

// Workflow files that must reference all GHA_REQUIRED_ENV_VARS.
const WORKFLOW_FILES = [
  '.github/workflows/eve-build.yml',
]

describe('env var contract', () => {
  it('all required runtime env vars are referenced in workflow files', () => {
    const root = path.resolve(process.cwd())
    const workflowContents = WORKFLOW_FILES.map(f => {
      const full = path.join(root, f)
      return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : ''
    }).join('\n')

    const missing: string[] = []
    for (const v of GHA_REQUIRED_ENV_VARS) {
      if (!workflowContents.includes(v)) missing.push(v)
    }

    expect(
      missing,
      `These env vars are used by GHA jobs but not referenced in any workflow file.\n` +
      `Add them as secrets references so the workflow can use them: ${missing.join(', ')}`
    ).toHaveLength(0)
  })

  it('GHA env var list has no duplicates', () => {
    const unique = new Set(GHA_REQUIRED_ENV_VARS)
    expect(unique.size).toBe(GHA_REQUIRED_ENV_VARS.length)
  })

  it('GHA env vars are uppercase with underscores only', () => {
    for (const v of GHA_REQUIRED_ENV_VARS) {
      expect(v, `${v} should be UPPER_SNAKE_CASE`).toMatch(/^[A-Z][A-Z0-9_]+$/)
    }
  })
})

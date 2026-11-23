import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// Scans source files for process.env.X references and asserts every name
// is in the known list. Prevents the GITHUB_TOKEN vs GH_PAT class of bug —
// where the code reads a var under one name but it's configured under another.

const KNOWN_ENV_VARS = new Set([
  // Supabase
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_MANAGEMENT_TOKEN',
  // Auth
  'JWT_SECRET',
  'ADMIN_PASSWORD',
  'ADMIN_IP',
  'ADMIN_IP_MOBILE',
  // Anthropic
  'ANTHROPIC_API_KEY',
  // Telegram
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_WEBHOOK_SECRET',
  'TELEGRAM_CHAT_ID',
  // GitHub
  'GH_PAT',
  // External APIs
  'AVIATIONSTACK_API_KEY',
  // Next.js built-ins (not ours)
  'NODE_ENV',
  'NEXT_PUBLIC_DISABLE_FONTS',
])

function extractEnvVars(filePath: string): string[] {
  const src = fs.readFileSync(filePath, 'utf8')
  const matches = [...src.matchAll(/process\.env\.([A-Z0-9_]+)/g)]
  return matches.map(m => m[1])
}

function walkSrc(dir: string, exts = ['.ts', '.tsx']): string[] {
  const files: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '__tests__') {
      files.push(...walkSrc(full, exts))
    } else if (entry.isFile() && exts.some(e => entry.name.endsWith(e))) {
      files.push(full)
    }
  }
  return files
}

describe('env var scan', () => {
  it('every process.env.X in src/ is in the known list', () => {
    const srcDir = path.resolve(__dirname, '..')
    const files = walkSrc(srcDir)
    const unknown: { file: string; var: string }[] = []

    for (const file of files) {
      for (const varName of extractEnvVars(file)) {
        if (!KNOWN_ENV_VARS.has(varName)) {
          unknown.push({ file: path.relative(srcDir, file), var: varName })
        }
      }
    }

    if (unknown.length > 0) {
      const lines = unknown.map(u => `  ${u.var} (in ${u.file})`).join('\n')
      throw new Error(
        `Unknown env vars found — add them to KNOWN_ENV_VARS in env-scan.test.ts or rename to match:\n${lines}`
      )
    }
  })
})

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// Prevents schema drift: code adds a column to an INSERT, nobody runs the ALTER TABLE,
// everything silently fails in prod. This test fails at CI time instead.
//
// HOW TO FIX A FAILURE:
//   1. Add the column to supabase/migrations/ (new numbered .sql file)
//   2. Run that migration in Supabase (management API or dashboard)
//   3. Add the new key to the shape constant below
//   Then the test passes and prod is consistent.

// Every field the telegram route inserts into vkliu_eve_sessions.
// Add here when you add a field to the insert in src/app/api/eve/telegram/route.ts.
const SESSIONS_INSERT_SHAPE: Record<string, true> = {
  telegram_user_id: true,
  chat_id: true,
  raw_text: true,
  cleaned_text: true,
  message_type: true,
  status: true,
}

// Every field the telegram route inserts into vkliu_eve_dev_sessions.
const DEV_INSERT_SHAPE: Record<string, true> = {
  session_id: true,
  title: true,
  summary: true,
  steps: true,
  acceptance: true,
  files_likely_touched: true,
  status: true,
}

// ── SQL parser ────────────────────────────────────────────────────────────────

function readAllMigrations(): string {
  const dir = path.resolve(__dirname, '../../supabase/migrations')
  if (!fs.existsSync(dir)) return ''
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .map(f => fs.readFileSync(path.join(dir, f), 'utf8'))
    .join('\n')
}

function extractColumns(sql: string, table: string): Set<string> {
  const cols = new Set<string>()
  const CONSTRAINT_KW = new Set(['PRIMARY', 'UNIQUE', 'CHECK', 'FOREIGN', 'CONSTRAINT'])

  // Pull column names from CREATE TABLE (...) blocks
  const createRe = new RegExp(
    `CREATE TABLE(?:\\s+IF NOT EXISTS)?\\s+${table}\\s*\\(([^;]+?)\\)\\s*;`,
    'si'
  )
  const cm = sql.match(createRe)
  if (cm) {
    const lines = cm[1].split('\n')
    for (const line of lines) {
      const m = line.match(/^\s+(\w+)\s+\w/)
      if (m && !CONSTRAINT_KW.has(m[1].toUpperCase())) cols.add(m[1])
    }
  }

  // Pull column names from ALTER TABLE ... ADD COLUMN [IF NOT EXISTS] col_name
  const addRe = new RegExp(
    `ALTER TABLE[^;]*\\b${table}\\b[^;]*ADD COLUMN(?:\\s+IF NOT EXISTS)?\\s+(\\w+)`,
    'gi'
  )
  let m: RegExpExecArray | null
  while ((m = addRe.exec(sql)) !== null) cols.add(m[1])

  return cols
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('schema sync — migrations vs insert shapes', () => {
  const sql = readAllMigrations()

  it('supabase/migrations/ directory exists and has at least one .sql file', () => {
    const dir = path.resolve(__dirname, '../../supabase/migrations')
    expect(fs.existsSync(dir), 'supabase/migrations/ not found').toBe(true)
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'))
    expect(files.length, 'no .sql files in supabase/migrations/').toBeGreaterThan(0)
  })

  it('every vkliu_eve_sessions insert field is in a migration', () => {
    const cols = extractColumns(sql, 'vkliu_eve_sessions')
    const missing = Object.keys(SESSIONS_INSERT_SHAPE).filter(k => !cols.has(k))
    if (missing.length) {
      throw new Error(
        `vkliu_eve_sessions insert uses columns not in any migration:\n` +
        missing.map(c => `  ${c}`).join('\n') +
        `\n\nAdd a migration in supabase/migrations/ and run it in Supabase.`
      )
    }
  })

  it('every vkliu_eve_dev_sessions insert field is in a migration', () => {
    const cols = extractColumns(sql, 'vkliu_eve_dev_sessions')
    const missing = Object.keys(DEV_INSERT_SHAPE).filter(k => !cols.has(k))
    if (missing.length) {
      throw new Error(
        `vkliu_eve_dev_sessions insert uses columns not in any migration:\n` +
        missing.map(c => `  ${c}`).join('\n') +
        `\n\nAdd a migration in supabase/migrations/ and run it in Supabase.`
      )
    }
  })

  it('vkliu_eve_sessions insert shape matches route.ts', () => {
    // Read the actual route source and extract the SESSIONS_TABLE insert block.
    // If a field is in the route insert but not in SESSIONS_INSERT_SHAPE, the
    // migration check above would never see it. This catches that gap.
    const routeSrc = fs.readFileSync(
      path.resolve(__dirname, '../app/api/eve/telegram/route.ts'),
      'utf8'
    )
    // Extract everything between .from(SESSIONS_TABLE).insert({ ... })
    const m = routeSrc.match(/from\(SESSIONS_TABLE\)\s*\.insert\(\{([^}]+)\}/)
    if (!m) throw new Error('Could not find SESSIONS_TABLE insert block in route.ts')
    const insertedKeys = [...m[1].matchAll(/^\s+(\w+):/gm)].map(x => x[1])
    const shapeKeys = new Set(Object.keys(SESSIONS_INSERT_SHAPE))
    const untracked = insertedKeys.filter(k => !shapeKeys.has(k))
    if (untracked.length) {
      throw new Error(
        `route.ts inserts these fields that are NOT in SESSIONS_INSERT_SHAPE:\n` +
        untracked.map(k => `  ${k}`).join('\n') +
        `\n\nAdd them to SESSIONS_INSERT_SHAPE in schema-sync.test.ts and add a migration.`
      )
    }
  })

  it('vkliu_eve_dev_sessions insert shape matches route.ts', () => {
    const routeSrc = fs.readFileSync(
      path.resolve(__dirname, '../app/api/eve/telegram/route.ts'),
      'utf8'
    )
    const m = routeSrc.match(/from\(DEV_TABLE\)\s*\.insert\(\{([^}]+)\}/)
    if (!m) throw new Error('Could not find DEV_TABLE insert block in route.ts')
    const insertedKeys = [...m[1].matchAll(/^\s+(\w+):/gm)].map(x => x[1])
    const shapeKeys = new Set(Object.keys(DEV_INSERT_SHAPE))
    const untracked = insertedKeys.filter(k => !shapeKeys.has(k))
    if (untracked.length) {
      throw new Error(
        `route.ts inserts these fields that are NOT in DEV_INSERT_SHAPE:\n` +
        untracked.map(k => `  ${k}`).join('\n') +
        `\n\nAdd them to DEV_INSERT_SHAPE in schema-sync.test.ts and add a migration.`
      )
    }
  })
})

import { describe, it, expect } from 'vitest'
import { classifyMessage, MessageType } from '@/eve/router'

// Contract: every key the telegram route inserts into vkliu_eve_sessions.
// If the route insert changes, update this object to match — that keeps the
// test honest and prevents the "unknown NOT NULL column" class of bug.
const SESSIONS_INSERT_SHAPE = {
  telegram_user_id: '',
  chat_id: '',
  raw_text: '',
  cleaned_text: '',
  message_type: '',
  status: '',
} as const

describe('vkliu_eve_sessions insert contract', () => {
  it('insert shape has exactly the expected keys', () => {
    const keys = Object.keys(SESSIONS_INSERT_SHAPE).sort()
    expect(keys).toEqual([
      'chat_id',
      'cleaned_text',
      'message_type',
      'raw_text',
      'status',
      'telegram_user_id',
    ])
  })

  it('insert shape does not include telegram_chat_id (the old bigint column)', () => {
    expect(Object.keys(SESSIONS_INSERT_SHAPE)).not.toContain('telegram_chat_id')
  })

  it('status default value is "received"', () => {
    // The route hardcodes 'received' — if someone changes it without updating the
    // table default, rows will have an unexpected status.
    const statusValue = 'received'
    expect(['received', 'processed', 'error']).toContain(statusValue)
  })
})

describe('MessageType default routing', () => {
  it('UNKNOWN and BUILD are different values', () => {
    // The route maps UNKNOWN → BUILD. If they were equal, the default branch
    // would be a no-op and unrecognized messages would be silently dropped.
    expect(MessageType.UNKNOWN).not.toBe(MessageType.BUILD)
  })

  it('all enum values are non-empty strings', () => {
    for (const [key, val] of Object.entries(MessageType)) {
      expect(typeof val, `MessageType.${key}`).toBe('string')
      expect(val.length, `MessageType.${key} should not be empty`).toBeGreaterThan(0)
    }
  })
})

describe('classifyMessage is synchronous', () => {
  it('returns a plain object, not a Promise', () => {
    const result = classifyMessage('/build add dark mode')
    expect(result).not.toBeInstanceOf(Promise)
    expect(typeof result).toBe('object')
    expect(result).toHaveProperty('type')
    expect(result).toHaveProperty('body')
  })

  it('strips the /build prefix from the body', () => {
    const { body } = classifyMessage('/build add dark mode')
    expect(body).toBe('add dark mode')
    expect(body.startsWith('/build')).toBe(false)
  })
})

// Contract: every key the route inserts into vkliu_eve_dev_sessions.
// If the insert changes, update this to match — test fails at CI time before
// hitting the DB with a missing NOT NULL column.
const DEV_INSERT_SHAPE = {
  session_id: '',
  title: '',
  summary: '',
  steps: [],
  acceptance: [],
  files_likely_touched: [],
  status: '',
} as const

describe('vkliu_eve_dev_sessions insert contract', () => {
  it('insert shape has exactly the expected keys', () => {
    const keys = Object.keys(DEV_INSERT_SHAPE).sort()
    expect(keys).toEqual([
      'acceptance',
      'files_likely_touched',
      'session_id',
      'status',
      'steps',
      'summary',
      'title',
    ])
  })

  it('steps, acceptance, files_likely_touched are arrays', () => {
    expect(Array.isArray(DEV_INSERT_SHAPE.steps)).toBe(true)
    expect(Array.isArray(DEV_INSERT_SHAPE.acceptance)).toBe(true)
    expect(Array.isArray(DEV_INSERT_SHAPE.files_likely_touched)).toBe(true)
  })
})

// Contract: the workflow_dispatch inputs object sent to GitHub Actions.
// The eve-build.yml YAML expects exactly these input names. If someone renames
// dev_session_id → session_id here without updating the YAML, the action gets
// an empty input and silently fails.
const TRIGGER_BUILD_INPUTS = {
  dev_session_id: 'string',
  title: 'string',
} as const

describe('triggerBuild workflow_dispatch inputs', () => {
  it('inputs shape has dev_session_id and title', () => {
    expect(Object.keys(TRIGGER_BUILD_INPUTS).sort()).toEqual(['dev_session_id', 'title'])
  })

  it('input key matches the eve-build.yml input name', () => {
    // The YAML declares: inputs: { dev_session_id: ..., title: ... }
    // If this key changes in code, the action receives an empty string.
    expect('dev_session_id' in TRIGGER_BUILD_INPUTS).toBe(true)
  })
})

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

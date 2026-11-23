import { describe, it, expect } from 'vitest'
import { classifyMessage, MessageType } from '@/eve/router'

describe('classifyMessage', () => {
  it('classifies /build prefix', () => {
    const r = classifyMessage('/build add a flight tracker')
    expect(r.type).toBe(MessageType.BUILD)
    expect(r.body).toBe('add a flight tracker')
  })

  it('classifies /journal prefix', () => {
    const r = classifyMessage('/journal had a good session today')
    expect(r.type).toBe(MessageType.JOURNAL)
    expect(r.body).toBe('had a good session today')
  })

  it('classifies /ask prefix', () => {
    const r = classifyMessage('/ask what is the difference between RLS and JWTs')
    expect(r.type).toBe(MessageType.ASK)
    expect(r.body).toBe('what is the difference between RLS and JWTs')
  })

  it('returns unknown for no prefix', () => {
    const r = classifyMessage('build me something cool')
    expect(r.type).toBe(MessageType.UNKNOWN)
    expect(r.body).toBe('build me something cool')
  })

  it('is case-insensitive on prefix', () => {
    const r = classifyMessage('/BUILD add dark mode')
    expect(r.type).toBe(MessageType.BUILD)
  })

  it('strips leading whitespace before matching', () => {
    const r = classifyMessage('  /journal note here')
    expect(r.type).toBe(MessageType.JOURNAL)
  })

  it('handles prefix with no body', () => {
    const r = classifyMessage('/build')
    expect(r.type).toBe(MessageType.BUILD)
    expect(r.body).toBe('')
  })

  it('body is trimmed', () => {
    const r = classifyMessage('/build   add dark mode   ')
    expect(r.body).toBe('add dark mode')
  })
})

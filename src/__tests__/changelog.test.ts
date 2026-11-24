import { describe, it, expect } from 'vitest'
import { CHANGELOG, type FeatureStatus } from '@/eve/changelog'

const VALID_STATUSES: FeatureStatus[] = ['open', 'closed', 'planned']

describe('CHANGELOG', () => {
  it('has at least one entry', () => {
    expect(CHANGELOG.length).toBeGreaterThan(0)
  })

  it('every entry has required fields', () => {
    for (const f of CHANGELOG) {
      expect(f.title, `${f.title}: missing title`).toBeTruthy()
      expect(f.date, `${f.title}: missing date`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(f.summary, `${f.title}: missing summary`).toBeTruthy()
      expect(VALID_STATUSES, `${f.title}: invalid status`).toContain(f.status)
      expect(Array.isArray(f.prs), `${f.title}: prs must be array`).toBe(true)
    }
  })

  it('planned entries have no PRs', () => {
    const planned = CHANGELOG.filter(f => f.status === 'planned')
    for (const f of planned) {
      expect(f.prs.length, `${f.title}: planned entry should have no PRs`).toBe(0)
    }
  })

  it('no duplicate titles', () => {
    const titles = CHANGELOG.map(f => f.title)
    const unique = new Set(titles)
    expect(unique.size).toBe(titles.length)
  })
})

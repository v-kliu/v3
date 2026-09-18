'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Client state for the grit tab. Updates are optimistic and persisted through
// /api/grit (tables vkliu_grit_*, see supabase/grit.sql).

export type Habit = {
  id: string
  name: string
  color: string
  startDate: string        // YYYY-MM-DD, first day the habit appears
  endDate: string | null   // YYYY-MM-DD, last day it appears (null = ongoing)
  position: number
}

export type DayEntry = {
  rating: number | null   // 1–10, independent of habit completion
  note: string            // free-form journal for the day
}

type GritData = {
  habits: Habit[]
  checks: Record<string, string[]>  // day → habit ids done that day
  days: Record<string, DayEntry>    // day → rating + journal
}

// Where the page kept data before Supabase; imported once, then cleared.
const LEGACY_KEY = 'grit:v1'

export const PALETTE = [
  '#E4572E', // vermilion
  '#E9A23B', // marigold
  '#6A994E', // moss
  '#2A9D8F', // teal
  '#3A6EA5', // cobalt
  '#8E5CD9', // violet
  '#D1495B', // rose
]

// Golden-angle hues once the fixed palette is used up, so extra habits still get distinct colors.
function extraColor(i: number): string {
  return `hsl(${Math.round((i * 137.508 + 20) % 360)} 58% 50%)`
}

export function nextColor(taken: string[]): string {
  const free = PALETTE.find(c => !taken.includes(c))
  if (free) return free
  for (let i = 0; ; i++) {
    const c = extraColor(i)
    if (!taken.includes(c)) return c
  }
}

// 1 = rose, 5 = marigold, 10 = teal
export function ratingColor(n: number): string {
  const hue = (355 + ((n - 1) / 9) * 165) % 360
  return `hsl(${Math.round(hue)} 62% ${n >= 4 && n <= 7 ? 46 : 50}%)`
}

export function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number): string {
  const d = parseDay(key)
  d.setDate(d.getDate() + n)
  return dayKey(d)
}

export function habitsOn(habits: Habit[], day: string): Habit[] {
  return habits
    .filter(h => h.startDate <= day && (h.endDate === null || day <= h.endDate))
    .sort((a, b) => a.position - b.position)
}

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

function seed(): GritData {
  const now = new Date()
  const start = dayKey(new Date(now.getFullYear(), now.getMonth(), 1))
  const names: [string, string][] = [
    ['gym', PALETTE[0]],
    ['no alcohol', PALETTE[1]],
    ['no porn', PALETTE[5]],
    ['read 10 pages', PALETTE[4]],
    ['asleep by 12', PALETTE[3]],
  ]
  return {
    habits: names.map(([name, color], i) => ({
      id: newId(), name, color, startDate: start, endDate: null, position: i,
    })),
    checks: {},
    days: {},
  }
}

export type SyncStatus = 'saved' | 'saving' | 'error'

async function send(method: 'PUT' | 'DELETE', body?: object, query = '') {
  const res = await fetch(`/api/grit${query}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`grit ${method} failed: ${res.status}`)
}

export function useGrit() {
  const [data, setData] = useState<GritData>({ habits: [], checks: {}, days: {} })
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState<SyncStatus>('saved')
  const ref = useRef(data)
  const inflight = useRef(0)
  const started = useRef(false)

  function commit(next: GritData) {
    ref.current = next
    setData(next)
  }

  // Optimistic: state is already updated; this just persists and reports.
  function persist(method: 'PUT' | 'DELETE', body?: object, query?: string) {
    inflight.current++
    setStatus('saving')
    send(method, body, query)
      .then(() => { if (--inflight.current === 0) setStatus('saved') })
      .catch(() => { inflight.current--; setStatus('error') })
  }

  useEffect(() => {
    // Strict mode runs effects twice in dev; a second run would seed/import twice.
    if (started.current) return
    started.current = true
    fetch('/api/grit')
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<GritData> })
      .then(async remote => {
        if (remote.habits.length) {
          commit({ ...remote, habits: uniqueColors(remote.habits) })
          return
        }
        // Empty database: move anything saved in this browser up, else start from defaults.
        let local: GritData | null = null
        try {
          const raw = localStorage.getItem(LEGACY_KEY)
          if (raw) local = JSON.parse(raw) as GritData
        } catch { /* storage blocked or corrupt */ }
        const initial = local
          ? { ...local, habits: uniqueColors(local.habits), days: local.days ?? {} }
          : seed()
        commit(initial)
        await send('PUT', { type: 'import', ...initial })
        try { localStorage.removeItem(LEGACY_KEY) } catch { /* ignore */ }
      })
      .catch(() => setStatus('error'))
      .finally(() => setLoaded(true))
  }, [])

  const toggle = useCallback((day: string, habitId: string) => {
    const prev = ref.current
    const done = prev.checks[day] ?? []
    const isDone = done.includes(habitId)
    const next = isDone ? done.filter(id => id !== habitId) : [...done, habitId]
    commit({ ...prev, checks: { ...prev.checks, [day]: next } })
    persist('PUT', { type: 'check', habitId, day, done: !isDone })
  }, [])

  const addHabit = useCallback((name: string, startDate: string) => {
    const prev = ref.current
    const position = prev.habits.reduce((max, h) => Math.max(max, h.position), -1) + 1
    const color = nextColor(prev.habits.map(h => h.color))
    const habit: Habit = { id: newId(), name, color, startDate, endDate: null, position }
    commit({ ...prev, habits: [...prev.habits, habit] })
    persist('PUT', { type: 'habit', habit })
  }, [])

  const updateHabit = useCallback((id: string, patch: Partial<Pick<Habit, 'name'>>) => {
    const prev = ref.current
    commit({ ...prev, habits: prev.habits.map(h => h.id === id ? { ...h, ...patch } : h) })
    if (patch.name) persist('PUT', { type: 'rename', id, name: patch.name })
  }, [])

  const setDay = useCallback((day: string, patch: Partial<DayEntry>) => {
    const prev = ref.current
    const entry = { ...(prev.days[day] ?? { rating: null, note: '' }), ...patch }
    commit({ ...prev, days: { ...prev.days, [day]: entry } })
    persist('PUT', { type: 'day', day, entry })
  }, [])

  // Stop showing a habit from `day` onward; history before it is kept.
  const stopHabit = useCallback((id: string, day: string) => {
    const prev = ref.current
    const habit = prev.habits.find(h => h.id === id)
    if (!habit) return
    if (day <= habit.startDate) {
      commit(removeHabit(prev, id))
    } else {
      const endDate = addDays(day, -1)
      const checks = Object.fromEntries(
        Object.entries(prev.checks).map(([d, ids]) => [d, d > endDate ? ids.filter(x => x !== id) : ids])
      )
      commit({ ...prev, checks, habits: prev.habits.map(h => h.id === id ? { ...h, endDate } : h) })
    }
    persist('PUT', { type: 'stop', id, day })
  }, [])

  const deleteHabit = useCallback((id: string) => {
    commit(removeHabit(ref.current, id))
    persist('DELETE', undefined, `?id=${encodeURIComponent(id)}`)
  }, [])

  return { ...data, loaded, status, toggle, addHabit, updateHabit, setDay, stopHabit, deleteHabit }
}

// Colors are assigned automatically; repair any duplicates left from older data.
function uniqueColors(habits: Habit[]): Habit[] {
  const taken: string[] = []
  return [...habits].sort((a, b) => a.position - b.position).map(h => {
    const color = taken.includes(h.color) ? nextColor([...taken, ...habits.map(x => x.color)]) : h.color
    taken.push(color)
    return { ...h, color }
  })
}

function removeHabit(data: GritData, id: string): GritData {
  return {
    ...data,
    habits: data.habits.filter(h => h.id !== id),
    checks: Object.fromEntries(Object.entries(data.checks).map(([d, ids]) => [d, ids.filter(x => x !== id)])),
  }
}

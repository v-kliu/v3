'use client'

import { useCallback, useEffect, useState } from 'react'

// Local-only for now (localStorage). Shapes mirror supabase/grit.sql so the
// swap to route handlers only touches this file.

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

const KEY = 'grit:v1'

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

export function useGrit() {
  const [data, setData] = useState<GritData>({ habits: [], checks: {}, days: {} })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let initial: GritData | null = null
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) initial = JSON.parse(raw) as GritData
    } catch { /* storage blocked or corrupt — fall through to seed */ }
    setData(initial ? { ...initial, days: initial.days ?? {} } : seed())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* ignore */ }
  }, [data, loaded])

  const toggle = useCallback((day: string, habitId: string) => {
    setData(prev => {
      const done = prev.checks[day] ?? []
      const next = done.includes(habitId) ? done.filter(id => id !== habitId) : [...done, habitId]
      return { ...prev, checks: { ...prev.checks, [day]: next } }
    })
  }, [])

  const addHabit = useCallback((name: string, color: string, startDate: string) => {
    setData(prev => {
      const position = prev.habits.reduce((max, h) => Math.max(max, h.position), -1) + 1
      const taken = prev.habits.map(h => h.color)
      const unique = taken.includes(color) ? nextColor(taken) : color
      const habit: Habit = { id: newId(), name, color: unique, startDate, endDate: null, position }
      return { ...prev, habits: [...prev.habits, habit] }
    })
  }, [])

  // Recoloring onto a color another habit already has swaps the two, so colors stay unique.
  const updateHabit = useCallback((id: string, patch: Partial<Pick<Habit, 'name' | 'color'>>) => {
    setData(prev => {
      const self = prev.habits.find(h => h.id === id)
      if (!self) return prev
      return {
        ...prev,
        habits: prev.habits.map(h => {
          if (h.id === id) return { ...h, ...patch }
          if (patch.color && h.color === patch.color) return { ...h, color: self.color }
          return h
        }),
      }
    })
  }, [])

  const setDay = useCallback((day: string, patch: Partial<DayEntry>) => {
    setData(prev => {
      const current = prev.days[day] ?? { rating: null, note: '' }
      return { ...prev, days: { ...prev.days, [day]: { ...current, ...patch } } }
    })
  }, [])

  // Stop showing a habit from `day` onward; history before it is kept.
  const stopHabit = useCallback((id: string, day: string) => {
    setData(prev => {
      const habit = prev.habits.find(h => h.id === id)
      if (!habit) return prev
      if (day <= habit.startDate) return removeHabit(prev, id)
      const endDate = addDays(day, -1)
      const checks = Object.fromEntries(
        Object.entries(prev.checks).map(([d, ids]) => [d, d > endDate ? ids.filter(x => x !== id) : ids])
      )
      return { ...prev, checks, habits: prev.habits.map(h => h.id === id ? { ...h, endDate } : h) }
    })
  }, [])

  const deleteHabit = useCallback((id: string) => {
    setData(prev => removeHabit(prev, id))
  }, [])

  return { ...data, loaded, toggle, addHabit, updateHabit, setDay, stopHabit, deleteHabit }
}

function removeHabit(data: GritData, id: string): GritData {
  return {
    ...data,
    habits: data.habits.filter(h => h.id !== id),
    checks: Object.fromEntries(Object.entries(data.checks).map(([d, ids]) => [d, ids.filter(x => x !== id)])),
  }
}

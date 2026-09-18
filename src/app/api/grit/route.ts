import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const HABITS = 'vkliu_grit_habits'
const CHECKS = 'vkliu_grit_checks'
const DAYS = 'vkliu_grit_days'

type HabitRow = {
  id: string
  name: string
  color: string
  start_date: string
  end_date: string | null
  position: number
}

type Habit = {
  id: string
  name: string
  color: string
  startDate: string
  endDate: string | null
  position: number
}

type DayEntry = { rating: number | null; note: string }

type Body =
  | { type: 'habit'; habit: Habit }
  | { type: 'rename'; id: string; name: string }
  | { type: 'stop'; id: string; day: string }
  | { type: 'check'; habitId: string; day: string; done: boolean }
  | { type: 'day'; day: string; entry: DayEntry }
  | { type: 'import'; habits: Habit[]; checks: Record<string, string[]>; days: Record<string, DayEntry> }

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

function toRow(h: Habit): HabitRow {
  return { id: h.id, name: h.name, color: h.color, start_date: h.startDate, end_date: h.endDate, position: h.position }
}

function fail(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET() {
  const [habits, checks, days] = await Promise.all([
    supabase.from(HABITS).select('id, name, color, start_date, end_date, position').order('position'),
    supabase.from(CHECKS).select('habit_id, day'),
    supabase.from(DAYS).select('day, rating, note'),
  ])
  const error = habits.error ?? checks.error ?? days.error
  if (error) return fail(error.message)

  const checkMap: Record<string, string[]> = {}
  for (const c of checks.data ?? []) (checkMap[c.day] ??= []).push(c.habit_id)

  const dayMap: Record<string, DayEntry> = {}
  for (const d of days.data ?? []) dayMap[d.day] = { rating: d.rating, note: d.note }

  return NextResponse.json({
    habits: (habits.data ?? []).map((h: HabitRow): Habit => ({
      id: h.id, name: h.name, color: h.color, startDate: h.start_date, endDate: h.end_date, position: h.position,
    })),
    checks: checkMap,
    days: dayMap,
  })
}

export async function PUT(request: Request) {
  const body = await request.json() as Body

  switch (body.type) {
    case 'habit': {
      const { error } = await supabase.from(HABITS).upsert(toRow(body.habit))
      return error ? fail(error.message) : NextResponse.json({ ok: true })
    }
    case 'rename': {
      const { error } = await supabase.from(HABITS).update({ name: body.name }).eq('id', body.id)
      return error ? fail(error.message) : NextResponse.json({ ok: true })
    }
    case 'stop': {
      if (!DAY_RE.test(body.day)) return fail('invalid day', 400)
      const { data: habit, error } = await supabase.from(HABITS).select('start_date').eq('id', body.id).single()
      if (error) return fail(error.message)
      // Stopping on or before its first day means it never existed.
      if (body.day <= habit.start_date) {
        const del = await supabase.from(HABITS).delete().eq('id', body.id)
        return del.error ? fail(del.error.message) : NextResponse.json({ ok: true })
      }
      const end = new Date(`${body.day}T00:00:00Z`)
      end.setUTCDate(end.getUTCDate() - 1)
      const endDate = end.toISOString().slice(0, 10)
      const [upd, del] = await Promise.all([
        supabase.from(HABITS).update({ end_date: endDate }).eq('id', body.id),
        supabase.from(CHECKS).delete().eq('habit_id', body.id).gt('day', endDate),
      ])
      const e = upd.error ?? del.error
      return e ? fail(e.message) : NextResponse.json({ ok: true })
    }
    case 'check': {
      if (!DAY_RE.test(body.day)) return fail('invalid day', 400)
      const { error } = body.done
        ? await supabase.from(CHECKS).upsert({ habit_id: body.habitId, day: body.day })
        : await supabase.from(CHECKS).delete().eq('habit_id', body.habitId).eq('day', body.day)
      return error ? fail(error.message) : NextResponse.json({ ok: true })
    }
    case 'day': {
      if (!DAY_RE.test(body.day)) return fail('invalid day', 400)
      const rating = body.entry.rating
      if (rating !== null && !(Number.isInteger(rating) && rating >= 1 && rating <= 10)) return fail('invalid rating', 400)
      const { error } = await supabase.from(DAYS).upsert({
        day: body.day, rating, note: body.entry.note ?? '', updated_at: new Date().toISOString(),
      })
      return error ? fail(error.message) : NextResponse.json({ ok: true })
    }
    case 'import': {
      // One-time move of browser-stored data into the database.
      if (body.habits.length) {
        const { error } = await supabase.from(HABITS).upsert(body.habits.map(toRow))
        if (error) return fail(error.message)
      }
      const ids = new Set(body.habits.map(h => h.id))
      const checkRows = Object.entries(body.checks).flatMap(([day, hs]) =>
        DAY_RE.test(day) ? hs.filter(id => ids.has(id)).map(habit_id => ({ habit_id, day })) : []
      )
      if (checkRows.length) {
        const { error } = await supabase.from(CHECKS).upsert(checkRows)
        if (error) return fail(error.message)
      }
      const dayRows = Object.entries(body.days)
        .filter(([day, e]) => DAY_RE.test(day) && (e.rating !== null || e.note.trim()))
        .map(([day, e]) => ({ day, rating: e.rating, note: e.note }))
      if (dayRows.length) {
        const { error } = await supabase.from(DAYS).upsert(dayRows)
        if (error) return fail(error.message)
      }
      return NextResponse.json({ ok: true })
    }
    default:
      return fail('unknown operation', 400)
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return fail('missing id', 400)
  const { error } = await supabase.from(HABITS).delete().eq('id', id)
  return error ? fail(error.message) : NextResponse.json({ ok: true })
}

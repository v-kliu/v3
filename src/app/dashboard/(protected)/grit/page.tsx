'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { LazyMotion, MotionConfig, AnimatePresence, domAnimation, m } from 'motion/react'
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Flame, X } from 'lucide-react'
import Ring from '@/components/grit/Ring'
import { useGrit, habitsOn, dayKey, parseDay, addDays, nextColor, ratingColor, PALETTE, type Habit, type DayEntry } from '@/components/grit/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['s', 'm', 't', 'w', 't', 'f', 's']
const EMPTY = new Set<string>()

function monthLabel(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase()
}

function dayLabel(key: string) {
  return parseDay(key).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toLowerCase()
}

export default function GritPage() {
  const grit = useGrit()
  const today = useMemo(() => dayKey(new Date()), [])
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selected, setSelected] = useState(today)
  const [revealed, setRevealed] = useState(false)
  const [settled, setSettled] = useState(false)

  // Rings render empty for one frame, then fill — gives the staggered sweep on load / month change.
  useEffect(() => {
    if (!grit.loaded) return
    setRevealed(false)
    setSettled(false)
    let raf = requestAnimationFrame(() => { raf = requestAnimationFrame(() => setRevealed(true)) })
    const t = setTimeout(() => setSettled(true), 1000)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
  }, [grit.loaded, cursor])

  const doneOn = (day: string) => new Set(grit.checks[day] ?? [])
  const isPerfect = (day: string) => {
    const hs = habitsOn(grit.habits, day)
    if (!hs.length) return false
    const done = doneOn(day)
    return hs.every(h => done.has(h.id))
  }

  const cells = useMemo(() => {
    const first = cursor.getDay()
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const out: (string | null)[] = Array(first).fill(null)
    for (let i = 1; i <= count; i++) out.push(dayKey(new Date(cursor.getFullYear(), cursor.getMonth(), i)))
    return out
  }, [cursor])

  const stats = useMemo(() => {
    let current = 0
    let d = isPerfect(today) ? today : addDays(today, -1)
    while (isPerfect(d)) { current++; d = addDays(d, -1) }

    let possible = 0, got = 0
    for (const day of cells) {
      if (!day || day > today) continue
      const hs = habitsOn(grit.habits, day)
      const done = doneOn(day)
      possible += hs.length
      got += hs.filter(h => done.has(h.id)).length
    }
    const perfectDays = cells.filter((day): day is string => !!day && day <= today && isPerfect(day)).length
    const ratings = cells.map(day => (day ? grit.days[day]?.rating : null)).filter((r): r is number => r != null)
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null
    return { current, pct: possible ? Math.round((got / possible) * 100) : 0, perfectDays, avg }
  }, [grit.habits, grit.checks, grit.days, cells, today])

  function shiftMonth(n: number) {
    setCursor(c => new Date(c.getFullYear(), c.getMonth() + n, 1))
  }

  const activeHabits = habitsOn(grit.habits, today)

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="w-full max-w-[980px] pb-16 text-[var(--text)]">
          {/* Header */}
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="m-0 text-[1.85rem] font-medium leading-none tracking-[0.14em]">grit</h1>
              <div className="mt-2.5 flex items-center gap-1.5">
                {activeHabits.map(h => (
                  <span key={h.id} className="h-1.5 w-5 rounded-full" style={{ background: h.color }} title={h.name} />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 font-mono">
              <Stat label="streak" value={stats.current} color={PALETTE[0]} icon={<Flame size={13} />} />
              <Stat label="this month" value={`${stats.pct}%`} color={PALETTE[3]} />
              <Stat label="perfect days" value={stats.perfectDays} color={PALETTE[5]} />
              <Stat
                label="avg day"
                value={stats.avg == null ? '–' : stats.avg.toFixed(1)}
                color={stats.avg == null ? 'var(--text-faint)' : ratingColor(Math.round(stats.avg))}
              />
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10">
            {/* Calendar */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-xs tracking-[0.08em] text-[var(--text-muted)]">{monthLabel(cursor)}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => shiftMonth(-1)} aria-label="previous month"><ChevronLeft size={15} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => shiftMonth(1)} aria-label="next month"><ChevronRight size={15} /></Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-y-2 font-mono">
                {WEEKDAYS.map((w, i) => (
                  <span key={i} className="pb-1 text-center text-[0.62rem] uppercase tracking-widest text-[var(--text-faint)]">{w}</span>
                ))}
                {cells.map((day, i) => {
                  if (!day) return <span key={`blank-${i}`} />
                  const future = day > today
                  const hs = habitsOn(grit.habits, day)
                  const perfect = !future && isPerfect(day)
                  const isSel = day === selected
                  const isToday = day === today
                  const rating = grit.days[day]?.rating ?? null
                  const hasNote = !!grit.days[day]?.note?.trim()
                  return (
                    <button
                      key={day}
                      onClick={() => setSelected(day)}
                      className={cn(
                        'group mx-auto flex flex-col items-center rounded-full p-0.5 pb-1 transition-[background,transform] duration-200 active:scale-95',
                        isSel && 'bg-[var(--bg-alt)]',
                        future && 'opacity-45'
                      )}
                      aria-label={dayLabel(day)}
                      aria-pressed={isSel}
                    >
                      <Ring
                        size={42}
                        stroke={3.5}
                        habits={future ? [] : hs}
                        done={revealed ? doneOn(day) : EMPTY}
                        delay={settled ? 0 : i * 12}
                      >
                        <span
                          className={cn(
                            'text-[0.72rem] tabular-nums transition-colors',
                            isToday ? 'font-semibold text-[var(--accent)]' : 'text-[var(--text-muted)]',
                            perfect && 'font-semibold text-[var(--text)]'
                          )}
                        >
                          {parseDay(day).getDate()}
                        </span>
                      </Ring>
                      <span className="mt-1 flex h-1.5 items-center gap-[3px]" aria-hidden>
                        {rating != null && (
                          <span className="h-1.5 rounded-full" style={{ width: 4 + rating * 1.4, background: ratingColor(rating) }} />
                        )}
                        {hasNote && <span className="h-1 w-1 rounded-full bg-[var(--text-faint)]" />}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5">
                {activeHabits.map(h => (
                  <span key={h.id} className="flex items-center gap-1.5 font-mono text-[0.66rem] text-[var(--text-muted)]">
                    <span className="h-2 w-2 rounded-full" style={{ background: h.color }} />
                    {h.name}
                  </span>
                ))}
              </div>
            </section>

            {/* Selected day */}
            <DayPanel
              key={selected}
              day={selected}
              today={today}
              habits={habitsOn(grit.habits, selected)}
              done={doneOn(selected)}
              allChecks={grit.checks}
              entry={grit.days[selected] ?? { rating: null, note: '' }}
              takenColors={grit.habits.map(h => h.color)}
              onDay={patch => grit.setDay(selected, patch)}
              onToggle={id => grit.toggle(selected, id)}
              onAdd={(name, color) => grit.addHabit(name, color, selected)}
              onRename={(id, name) => grit.updateHabit(id, { name })}
              onRecolor={(id, color) => grit.updateHabit(id, { color })}
              onStop={id => grit.stopHabit(id, selected)}
              onDelete={grit.deleteHabit}
            />
          </div>
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}

function Stat({ label, value, color, icon }: { label: string; value: string | number; color: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-end">
      <span className="flex items-center gap-1 text-xl font-medium tabular-nums leading-none" style={{ color }}>
        {icon}{value}
      </span>
      <span className="mt-1.5 text-[0.6rem] uppercase tracking-[0.12em] text-[var(--text-faint)]">{label}</span>
    </div>
  )
}

type PanelProps = {
  day: string
  today: string
  habits: Habit[]
  done: Set<string>
  allChecks: Record<string, string[]>
  entry: DayEntry
  takenColors: string[]
  onDay: (patch: Partial<DayEntry>) => void
  onToggle: (id: string) => void
  onAdd: (name: string, color: string) => void
  onRename: (id: string, name: string) => void
  onRecolor: (id: string, color: string) => void
  onStop: (id: string) => void
  onDelete: (id: string) => void
}

function DayPanel({ day, today, habits, done, allChecks, entry, takenColors, onDay, onToggle, onAdd, onRename, onRecolor, onStop, onDelete }: PanelProps) {
  const future = day > today
  const count = habits.filter(h => done.has(h.id)).length
  const pct = habits.length ? Math.round((count / habits.length) * 100) : 0
  const perfect = habits.length > 0 && count === habits.length

  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(() => nextColor(takenColors))
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function streakFor(id: string) {
    let n = 0
    let d = (allChecks[day] ?? []).includes(id) ? day : addDays(day, -1)
    while ((allChecks[d] ?? []).includes(id)) { n++; d = addDays(d, -1) }
    return n
  }

  function submit() {
    const v = name.trim()
    if (!v) return
    onAdd(v, color)
    setName('')
    setAdding(false)
    setColor(nextColor([...takenColors, color]))
  }

  return (
    <m.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.5)_inset] md:p-6"
    >
      <div className="mb-5 flex items-center gap-5">
        <m.div
          animate={perfect ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Ring size={104} stroke={9} habits={habits} done={shown ? done : EMPTY}>
            <div className="flex flex-col items-center font-mono">
              <span className="text-xl font-medium tabular-nums leading-none">{pct}%</span>
              <span className="mt-1 text-[0.58rem] text-[var(--text-faint)]">{count}/{habits.length}</span>
            </div>
          </Ring>
        </m.div>
        <div className="min-w-0">
          <p className="m-0 text-base font-medium leading-tight">{dayLabel(day)}</p>
          <p className="m-0 mt-1 font-mono text-[0.66rem] tracking-[0.06em] text-[var(--text-faint)]">
            {day === today ? 'today' : future ? 'upcoming — plan only' : perfect ? 'every box checked' : 'past day'}
          </p>
        </div>
      </div>

      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        <AnimatePresence initial={false}>
          {habits.map(h => {
            const checked = done.has(h.id)
            const streak = streakFor(h.id)
            return (
              <m.li
                key={h.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
                  style={{ background: checked ? `${h.color}1A` : 'transparent' }}
                >
                  <Checkbox
                    id={`h-${h.id}`}
                    checked={checked}
                    disabled={future}
                    color={h.color}
                    onCheckedChange={() => onToggle(h.id)}
                  />
                  {renaming === h.id ? (
                    <input
                      autoFocus
                      value={renameDraft}
                      onChange={e => setRenameDraft(e.target.value)}
                      onBlur={() => { if (renameDraft.trim()) onRename(h.id, renameDraft.trim()); setRenaming(null) }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') e.currentTarget.blur()
                        if (e.key === 'Escape') setRenaming(null)
                      }}
                      className="min-w-0 flex-1 border-b border-[var(--border)] bg-transparent text-sm outline-none"
                    />
                  ) : (
                    <label
                      htmlFor={`h-${h.id}`}
                      className={cn(
                        'min-w-0 flex-1 cursor-pointer select-none truncate text-sm transition-colors',
                        checked ? 'text-[var(--text)]' : 'text-[var(--text-muted)]',
                        future && 'cursor-default'
                      )}
                    >
                      {h.name}
                    </label>
                  )}
                  {streak > 1 && (
                    <span className="flex items-center gap-0.5 font-mono text-[0.62rem] tabular-nums" style={{ color: h.color }}>
                      <Flame size={10} />{streak}
                    </span>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--text-faint)] opacity-60 group-hover:opacity-100" aria-label={`${h.name} options`}>
                        <MoreHorizontal size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <div className="flex gap-1.5 px-2 py-1.5">
                        {PALETTE.map(c => (
                          <button
                            key={c}
                            onClick={() => onRecolor(h.id, c)}
                            className={cn('h-4 w-4 rounded-full transition-transform hover:scale-110', c === h.color && 'ring-2 ring-offset-1 ring-offset-[var(--bg)]')}
                            style={{ background: c, ['--tw-ring-color' as string]: c }}
                            aria-label={`color ${c}`}
                          />
                        ))}
                      </div>
                      <DropdownMenuItem onSelect={() => { setRenaming(h.id); setRenameDraft(h.name) }}>rename</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onStop(h.id)}>stop from this day on</DropdownMenuItem>
                      <DropdownMenuItem className="text-[var(--accent)]" onSelect={() => onDelete(h.id)}>delete everywhere</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </m.li>
            )
          })}
        </AnimatePresence>
      </ul>

      {!habits.length && (
        <p className="my-3 font-mono text-xs text-[var(--text-faint)]">no habits on this day yet.</p>
      )}

      <div className="mt-4 border-t border-dashed border-[var(--border)] pt-4">
        <AnimatePresence mode="wait" initial={false}>
          {adding ? (
            <m.form
              key="form"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              onSubmit={e => { e.preventDefault(); submit() }}
              className="flex flex-col gap-3"
            >
              <div className="flex gap-2">
                <Input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. cold shower" maxLength={40}
                  onKeyDown={e => { if (e.key === 'Escape') setAdding(false) }} />
                <Button type="submit" disabled={!name.trim()}>add</Button>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setAdding(false)} aria-label="cancel"><X size={14} /></Button>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  {(PALETTE.includes(color) ? PALETTE : [...PALETTE, color]).map(c => {
                    const taken = takenColors.includes(c)
                    return (
                      <button
                        type="button"
                        key={c}
                        disabled={taken}
                        onClick={() => setColor(c)}
                        className={cn(
                          'h-5 w-5 rounded-full transition-transform',
                          c === color ? 'scale-110 ring-2 ring-offset-2 ring-offset-[var(--bg-raised)]' : 'hover:scale-110',
                          taken && 'scale-50 cursor-not-allowed opacity-40 hover:scale-50'
                        )}
                        style={{ background: c, ['--tw-ring-color' as string]: c }}
                        aria-label={taken ? `color ${c} (in use)` : `color ${c}`}
                      />
                    )
                  })}
                </div>
                <span className="shrink-0 font-mono text-[0.6rem] text-[var(--text-faint)]">
                  from {parseDay(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()} on
                </span>
              </div>
            </m.form>
          ) : (
            <m.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              <Button variant="ghost" size="sm" className="-ml-2 font-mono text-[var(--text-muted)]" onClick={() => setAdding(true)}>
                <Plus size={13} /> add habit from this day
              </Button>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <DayJournal entry={entry} disabled={future} onChange={onDay} />
    </m.section>
  )
}

function DayJournal({ entry, disabled, onChange }: { entry: DayEntry; disabled: boolean; onChange: (patch: Partial<DayEntry>) => void }) {
  const [note, setNote] = useState(entry.note)
  const [saved, setSaved] = useState(true)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<string | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Flush an unsaved note when switching days (the panel remounts per day).
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
    if (pending.current !== null) onChangeRef.current({ note: pending.current })
  }, [])

  function handleNote(value: string) {
    setNote(value)
    setSaved(false)
    pending.current = value
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      onChangeRef.current({ note: value })
      pending.current = null
      setSaved(true)
    }, 600)
  }

  const rating = entry.rating

  return (
    <div className="mt-5 border-t border-dashed border-[var(--border)] pt-4">
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--text-faint)]">rate the day</span>
        <span className="font-mono text-sm font-medium tabular-nums" style={{ color: rating ? ratingColor(rating) : 'var(--text-faint)' }}>
          {rating ? `${rating}/10` : '–/10'}
        </span>
      </div>
      <div className="grid grid-cols-10 gap-1" role="radiogroup" aria-label="rate the day">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const on = rating != null && n <= rating
          const c = ratingColor(n)
          return (
            <button
              key={n}
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} out of 10`}
              disabled={disabled}
              onClick={() => onChange({ rating: rating === n ? null : n })}
              className="group flex flex-col items-center gap-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span
                className="h-6 w-full rounded-[5px] border transition-[background-color,border-color,transform] duration-200 group-hover:-translate-y-0.5 group-active:scale-95"
                style={{
                  background: on ? c : 'transparent',
                  borderColor: on ? c : 'var(--border)',
                  transitionDelay: on ? `${(n - 1) * 18}ms` : '0ms',
                }}
              />
              <span className={cn('font-mono text-[0.58rem] tabular-nums', rating === n ? 'text-[var(--text)]' : 'text-[var(--text-faint)]')}>{n}</span>
            </button>
          )
        })}
      </div>

      <div className="mb-1.5 mt-4 flex items-baseline justify-between">
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--text-faint)]">thoughts</span>
        <span className="font-mono text-[0.58rem] text-[var(--text-faint)]">{saved ? (note ? 'saved' : '') : 'saving…'}</span>
      </div>
      <textarea
        value={note}
        onChange={e => handleNote(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? "this day hasn't happened yet." : 'what happened, how it felt, what to do better…'}
        rows={5}
        className="w-full resize-y rounded-md border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm leading-relaxed placeholder:text-[var(--text-faint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text)]/15 disabled:opacity-50"
      />
    </div>
  )
}

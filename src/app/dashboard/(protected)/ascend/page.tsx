'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, m } from 'motion/react'
import {
  Utensils, Droplets, Scale, BookOpen, Dumbbell, Moon, Brain, Wallet,
  Sparkles, Heart, Footprints, Sun, Shirt, GlassWater, Pencil, Check,
  ArrowUp, ArrowDown, Plus,
} from 'lucide-react'
import { colorForId } from '@/components/dashboard/theme'
import { useTabTint } from '@/components/dashboard/useTabTint'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'

const ICONS = {
  utensils: Utensils, droplets: Droplets, scale: Scale, book: BookOpen,
  dumbbell: Dumbbell, moon: Moon, brain: Brain, wallet: Wallet,
  sparkles: Sparkles, heart: Heart, footprints: Footprints, sun: Sun,
  shirt: Shirt, water: GlassWater, pencil: Pencil,
} as const

type IconKey = keyof typeof ICONS
const ICON_KEYS = Object.keys(ICONS) as IconKey[]

function iconFor(key: string) {
  return ICONS[key as IconKey] ?? Sparkles
}

type Status = 'todo' | 'active' | 'done'
type Step = { id: string; title: string; note: string; status: Status }
type Track = { id: number; name: string; icon: string; steps: Step[]; position: number }

const NEXT_STATUS: Record<Status, Status> = { todo: 'active', active: 'done', done: 'todo' }

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function AscendPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState<'saved' | 'saving'>('saved')
  const [editingTrackId, setEditingTrackId] = useState<number | null>(null)
  const [trackName, setTrackName] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editing, setEditing] = useState<{ stepId: string; field: 'title' | 'note' } | null>(null)
  const [draft, setDraft] = useState('')
  const [composing, setComposing] = useState('')
  const [hovered, setHovered] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/ascend')
      .then(r => r.json())
      .then((data: Track[]) => {
        if (!Array.isArray(data)) { setLoaded(true); return }
        const normalized = data.map(t => ({ ...t, steps: Array.isArray(t.steps) ? t.steps : [] }))
        setTracks(normalized)
        if (normalized.length) setActiveId(normalized[0].id)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const persist = useCallback((trackId: number, steps: Step[]) => {
    setStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetch('/api/ascend', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trackId, steps }),
      }).finally(() => setStatus('saved'))
    }, 700)
  }, [])

  const active = tracks.find(t => t.id === activeId) ?? null
  const trackColor = active ? colorForId(active.id) : null

  // Switching tracks re-tints the whole page, like switching rooms.
  useTabTint(trackColor)

  function mutateSteps(fn: (steps: Step[]) => Step[]) {
    if (!active) return
    const next = fn(active.steps)
    setTracks(prev => prev.map(t => t.id === active.id ? { ...t, steps: next } : t))
    persist(active.id, next)
  }

  function cycleStatus(stepId: string) {
    mutateSteps(steps => steps.map(s =>
      s.id === stepId ? { ...s, status: NEXT_STATUS[s.status] } : s
    ))
  }

  function commitEdit() {
    if (!editing) return
    const { stepId, field } = editing
    const value = draft.trim()
    if (field === 'title' && !value) {
      mutateSteps(steps => steps.filter(s => s.id !== stepId))
    } else {
      mutateSteps(steps => steps.map(s => s.id === stepId ? { ...s, [field]: value } : s))
    }
    setEditing(null)
  }

  function move(stepId: string, delta: number) {
    mutateSteps(steps => {
      const i = steps.findIndex(s => s.id === stepId)
      const j = i + delta
      if (i < 0 || j < 0 || j >= steps.length) return steps
      const next = [...steps]
      const tmp = next[i]
      next[i] = next[j]
      next[j] = tmp
      return next
    })
  }

  function addStep() {
    const title = composing.trim()
    if (!title) return
    mutateSteps(steps => [...steps, { id: newId(), title, note: '', status: 'todo' }])
    setComposing('')
  }

  async function addTrack() {
    const res = await fetch('/api/ascend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'new', icon: 'sparkles' }),
    })
    const track: Track = await res.json()
    setTracks(prev => [...prev, { ...track, steps: [] }])
    setActiveId(track.id)
    setEditingTrackId(track.id)
    setTrackName('new')
  }

  async function commitTrackName() {
    if (editingTrackId === null) return
    const name = trackName.trim() || 'untitled'
    const id = editingTrackId
    setTracks(prev => prev.map(t => t.id === id ? { ...t, name } : t))
    setEditingTrackId(null)
    await fetch('/api/ascend', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
    })
  }

  async function setIcon(icon: string) {
    if (!active) return
    const id = active.id
    setTracks(prev => prev.map(t => t.id === id ? { ...t, icon } : t))
    setPickerOpen(false)
    await fetch('/api/ascend', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, icon }),
    })
  }

  async function deleteTrack(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (tracks.length <= 1) return
    const remaining = tracks.filter(t => t.id !== id)
    setTracks(remaining)
    if (activeId === id) setActiveId(remaining[0]?.id ?? null)
    await fetch(`/api/ascend?id=${id}`, { method: 'DELETE' })
  }

  const steps = active?.steps ?? []
  const doneCount = steps.filter(s => s.status === 'done').length
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0
  const allSteps = tracks.reduce((n, t) => n + t.steps.length, 0)
  const allDone = tracks.reduce((n, t) => n + t.steps.filter(s => s.status === 'done').length, 0)

  return (
    <div className="ascend-page" style={trackColor ? ({ '--track': trackColor } as React.CSSProperties) : undefined}>

      <header className="ascend-header">
        <div>
          <h1>向上</h1>
          <p>upward — one rung at a time</p>
        </div>
        {loaded && tracks.length > 0 && (
          <div className="ascend-stats">
            <div className="ascend-stat">
              <span className="ascend-stat-value" style={{ color: 'var(--track)' }}>{pct}%</span>
              <span className="ascend-stat-label">this track</span>
            </div>
            <div className="ascend-stat">
              <span className="ascend-stat-value">{allDone}<span className="ascend-stat-dim">/{allSteps}</span></span>
              <span className="ascend-stat-label">all steps</span>
            </div>
          </div>
        )}
      </header>

      {loaded && (
        <div className="ascend-tracks">
          {tracks.map(track => {
            const Icon = iconFor(track.icon)
            const isActive = track.id === activeId
            const total = track.steps.length
            const done = track.steps.filter(s => s.status === 'done').length
            return (
              <button
                key={track.id}
                onClick={() => {
                  if (isActive) { setEditingTrackId(track.id); setTrackName(track.name) }
                  else { setActiveId(track.id); setEditingTrackId(null); setPickerOpen(false) }
                }}
                className={`ascend-track${isActive ? ' is-active' : ''}`}
                style={{ '--c': colorForId(track.id) } as React.CSSProperties}
              >
                {isActive && (
                  <m.span
                    layoutId="ascend-track-pill"
                    className="ascend-track-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon size={13} strokeWidth={1.75} className="ascend-track-icon" />
                {editingTrackId === track.id ? (
                  <input
                    autoFocus
                    value={trackName}
                    onChange={e => setTrackName(e.target.value)}
                    onBlur={commitTrackName}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); commitTrackName() }
                      if (e.key === 'Escape') setEditingTrackId(null)
                    }}
                    onClick={e => e.stopPropagation()}
                    className="ascend-track-input"
                    style={{ width: `${Math.max(trackName.length, 3)}ch` }}
                  />
                ) : (
                  <span className="ascend-track-name">{track.name}</span>
                )}
                {total > 0 && <span className="ascend-track-count">{done}/{total}</span>}
                {isActive && tracks.length > 1 && (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={e => deleteTrack(track.id, e)}
                    className="ascend-track-x"
                  >
                    ×
                  </span>
                )}
              </button>
            )
          })}
          <button onClick={addTrack} className="ascend-track ascend-track-add" title="new track">
            <Plus size={12} strokeWidth={2} />
          </button>
        </div>
      )}

      {active && (
        <div className="ascend-meter-row">
          <button onClick={() => setPickerOpen(o => !o)} className="ascend-icon-btn" title="change icon">
            {(() => { const I = iconFor(active.icon); return <I size={14} strokeWidth={1.75} /> })()}
          </button>

          <div className="ascend-meter">
            {steps.length === 0
              ? <span className="ascend-seg is-empty" />
              : steps.map(s => <span key={s.id} className={`ascend-seg is-${s.status}`} />)}
          </div>

          <span className="ascend-count">
            {doneCount}<span className="ascend-count-total"> / {steps.length}</span>
          </span>

          <span className="ascend-save">{status === 'saving' ? 'saving…' : 'saved'}</span>
        </div>
      )}

      <AnimatePresence initial={false}>
        {pickerOpen && active && (
          <m.div
            key="picker"
            className="ascend-picker"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {ICON_KEYS.map(key => {
              const I = ICONS[key]
              return (
                <button
                  key={key}
                  onClick={() => setIcon(key)}
                  className={`ascend-picker-btn${active.icon === key ? ' is-active' : ''}`}
                  title={key}
                >
                  <I size={14} strokeWidth={1.75} />
                </button>
              )
            })}
          </m.div>
        )}
      </AnimatePresence>

      {active && (
        <div className="ascend-card">
          <ol key={active.id} className="ascend-rail">
            <AnimatePresence>
              {steps.map((step, i) => {
                const isLast = i === steps.length - 1
                const isHovered = hovered === step.id
                return (
                  <m.li
                    key={step.id}
                    layout="position"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22, delay: Math.min(i, 7) * 0.03 }}
                    className={`ascend-step is-${step.status}`}
                    onMouseEnter={() => setHovered(step.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className="ascend-node-col">
                      <button
                        onClick={() => cycleStatus(step.id)}
                        className="ascend-node"
                        title={step.status}
                        aria-label={`${step.title} — ${step.status}`}
                      >
                        {step.status === 'done' && <Check size={9} strokeWidth={3.5} />}
                      </button>
                      {!isLast && <span className="ascend-connector" />}
                    </div>

                    <div className="ascend-body">
                      <div className="ascend-title-row">
                        {editing?.stepId === step.id && editing.field === 'title' ? (
                          <input
                            autoFocus
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
                              if (e.key === 'Escape') setEditing(null)
                            }}
                            className="ascend-edit ascend-edit-title"
                          />
                        ) : (
                          <span
                            className="ascend-title"
                            onClick={() => { setEditing({ stepId: step.id, field: 'title' }); setDraft(step.title) }}
                          >
                            {step.title}
                          </span>
                        )}

                        <span className="ascend-actions" style={{ opacity: isHovered ? 1 : 0 }}>
                          <button onClick={() => move(step.id, -1)} disabled={i === 0} title="move up">
                            <ArrowUp size={11} strokeWidth={2} />
                          </button>
                          <button onClick={() => move(step.id, 1)} disabled={isLast} title="move down">
                            <ArrowDown size={11} strokeWidth={2} />
                          </button>
                          <button onClick={() => mutateSteps(s => s.filter(x => x.id !== step.id))} title="remove">
                            ×
                          </button>
                        </span>
                      </div>

                      {editing?.stepId === step.id && editing.field === 'note' ? (
                        <input
                          autoFocus
                          value={draft}
                          onChange={e => setDraft(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
                            if (e.key === 'Escape') setEditing(null)
                          }}
                          placeholder="a detail…"
                          className="ascend-edit ascend-edit-note"
                        />
                      ) : step.note ? (
                        <p
                          className="ascend-note"
                          onClick={() => { setEditing({ stepId: step.id, field: 'note' }); setDraft(step.note) }}
                        >
                          {step.note}
                        </p>
                      ) : (
                        <button
                          className="ascend-note-add"
                          style={{ opacity: isHovered ? 1 : 0 }}
                          onClick={() => { setEditing({ stepId: step.id, field: 'note' }); setDraft('') }}
                        >
                          + note
                        </button>
                      )}
                    </div>
                  </m.li>
                )
              })}
            </AnimatePresence>

            <li className="ascend-step ascend-composer">
              <div className="ascend-node-col">
                <span className="ascend-node-ghost" />
              </div>
              <input
                value={composing}
                onChange={e => setComposing(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStep() } }}
                onBlur={addStep}
                placeholder="next step…"
                className="ascend-compose-input"
              />
            </li>
          </ol>
        </div>
      )}

      {loaded && tracks.length === 0 && (
        <p style={{ fontFamily: mono, fontSize: '0.78rem', color: 'var(--text-faint)' }}>
          no tracks yet — run the vkliu_growth_content migration, then hit +
        </p>
      )}
    </div>
  )
}

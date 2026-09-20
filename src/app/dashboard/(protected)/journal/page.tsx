'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Mic, Square, Save, Trash2, RotateCcw, Pencil, RefreshCw, ArrowRight, ChevronDown } from 'lucide-react'
import { PALETTE, ratingColor } from '@/components/grit/store'
import { TAB_COLORS, inkOf, tint } from '@/components/dashboard/theme'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'


interface Entry {
  id: string
  created_at: string
  title: string
  transcript: string
  duration_seconds: number
  entry_type: 'voice' | 'manual'
  rating: number | null
}

interface JobResult {
  id: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  transcript: string | null
  title: string | null
  rating: number | null
  error: string | null
  duration_seconds: number
  retry_count: number
}

type Phase = 'idle' | 'recording' | 'uploading' | 'processing' | 'analyzing' | 'preview' | 'saving' | 'failed'
type Tab = 'voice' | 'manual'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function JournalPage() {
  const [tab, setTab] = useState<Tab>('voice')
  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [aiTitle, setAiTitle] = useState('')
  const [aiRating, setAiRating] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [manualText, setManualText] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobRetryCount, setJobRetryCount] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/journal')
      const json = await res.json()
      if (json.entries) setEntries(json.entries)
    } catch { /* silent */ }
    finally { setLoadingEntries(false) }
  }, [])

  useEffect(() => { loadEntries() }, [loadEntries])

  // Clean up polling on unmount
  useEffect(() => {
    return () => { stopPolling() }
  }, [])

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function startPolling(id: string) {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/journal/job/${id}`)
        if (!res.ok) return
        const job: JobResult = await res.json()

        if (job.status === 'done') {
          stopPolling()
          setTranscript(job.transcript ?? '')
          setAiTitle(job.title ?? job.transcript?.slice(0, 60) ?? '')
          setAiRating(job.rating ?? null)
          setPhase('preview')
        } else if (job.status === 'failed') {
          stopPolling()
          setJobRetryCount(job.retry_count)
          setError(
            job.retry_count >= 3
              ? 'Transcription failed after 3 attempts. Discard and try a new recording.'
              : 'Transcription failed.'
          )
          setPhase('failed')
        }
      } catch { /* keep polling on network hiccup */ }
    }, 3000)
  }

  async function analyze(text: string): Promise<{ title: string; rating: number | null }> {
    try {
      const res = await fetch('/api/journal/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      })
      const json = await res.json()
      return { title: json.title ?? text.slice(0, 60), rating: json.rating ?? null }
    } catch {
      return { title: text.slice(0, 60), rating: null }
    }
  }

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start(250)
      mediaRecorderRef.current = recorder
      durationRef.current = 0
      setElapsed(0)
      timerRef.current = setInterval(() => {
        durationRef.current += 1
        setElapsed(durationRef.current)
      }, 1000)
      setPhase('recording')
    } catch {
      setError('Microphone access denied. Allow microphone access and try again.')
    }
  }

  async function stopRecording() {
    if (!mediaRecorderRef.current) return
    if (timerRef.current) clearInterval(timerRef.current)
    const recorder = mediaRecorderRef.current
    const duration = durationRef.current

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve()
      recorder.stop()
    })
    recorder.stream.getTracks().forEach((t) => t.stop())
    setPhase('uploading')

    const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
    const form = new FormData()
    form.append('audio', blob)
    form.append('duration', String(duration))

    try {
      const res = await fetch('/api/journal/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error || 'Upload failed.')
        setPhase('idle')
        return
      }
      setJobId(json.jobId)
      setElapsed(duration)
      setPhase('processing')
      startPolling(json.jobId)
    } catch {
      setError('Upload failed. Try again.')
      setPhase('idle')
    }
  }

  async function retryJob() {
    if (!jobId) return
    setError('')
    setPhase('processing')

    try {
      const res = await fetch(`/api/journal/job/${jobId}/retry`, { method: 'POST' })
      if (res.ok) {
        startPolling(jobId)
      } else {
        setError('Retry failed.')
        setPhase('failed')
      }
    } catch {
      setError('Retry failed.')
      setPhase('failed')
    }
  }

  async function analyzeManual() {
    if (!manualText.trim()) return
    setPhase('analyzing')
    const { title, rating } = await analyze(manualText.trim())
    setTranscript(manualText.trim())
    setAiTitle(title)
    setAiRating(rating)
    setPhase('preview')
  }

  async function saveEntry(entryType: Tab) {
    setPhase('saving')
    try {
      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: aiTitle,
          transcript,
          duration_seconds: entryType === 'voice' ? elapsed : 0,
          entry_type: entryType,
          rating: aiRating,
        }),
      })
      setPhase('idle')
      setTranscript('')
      setAiTitle('')
      setAiRating(null)
      setElapsed(0)
      setJobId(null)
      if (entryType === 'manual') setManualText('')
      loadEntries()
    } catch {
      setError('Failed to save. Try again.')
      setPhase('preview')
    }
  }

  function discard() {
    stopPolling()
    setPhase('idle')
    setTranscript('')
    setAiTitle('')
    setAiRating(null)
    setElapsed(0)
    setError('')
    setJobId(null)
    setJobRetryCount(0)
  }

  const isActive = phase === 'recording'
  const isBusy = phase === 'uploading' || phase === 'processing' || phase === 'saving' || phase === 'analyzing'
  const inPreview = phase === 'preview' || phase === 'saving'
  const showRecorder = phase === 'idle' || phase === 'recording' || phase === 'uploading' || phase === 'processing' || phase === 'failed'

  const rated = entries.filter(e => e.rating !== null)
  const avg = rated.length ? rated.reduce((a, e) => a + (e.rating ?? 0), 0) / rated.length : null
  const voiceMins = Math.round(entries.reduce((a, e) => a + (e.entry_type === 'voice' ? e.duration_seconds : 0), 0) / 60)

  return (
    <div className="w-full max-w-[1120px] pb-16 text-[var(--text)]">

      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[1.85rem] font-medium leading-none tracking-[0.14em]">journal</h1>
          <p className="m-0 mt-2.5 font-mono text-[0.68rem] tracking-[0.08em] text-[var(--text-faint)]">
            speak freely. transcribed and stored.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 font-mono">
          <Stat label="entries" value={entries.length} color={ACCENT} />
          <Stat label="avg day" value={avg === null ? '–' : avg.toFixed(1)} color={avg === null ? 'var(--text-faint)' : ratingColor(Math.round(avg))} />
          <Stat label="min recorded" value={voiceMins} color={PALETTE[3]} />
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">

        {/* ── Capture ── */}
        <section className="lg:sticky lg:top-6">
          {/* Mode toggle */}
          <div className="mb-4 inline-flex rounded-full bg-[var(--bg-alt)] p-1" role="tablist">
            {(['voice', 'manual'] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => { setTab(t); setError(''); if (phase !== 'recording') { discard() } }}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-[0.78rem] tracking-[0.04em] transition-colors',
                  tab === t ? '' : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'
                )}
                style={tab === t ? { color: inkOf(ACCENT) } : undefined}
              >
                {tab === t && (
                  <m.span
                    layoutId="journal-mode"
                    className="absolute inset-0 rounded-full bg-[var(--bg-raised)]"
                    style={{ boxShadow: `inset 0 0 0 1px ${tint(ACCENT, 40)}, 0 1px 3px rgba(60,40,10,0.12)` }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  {t === 'voice' ? <Mic size={12} /> : <Pencil size={12} />}
                  {t}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>

            {/* Recorder */}
            {tab === 'voice' && showRecorder && (
              <m.div key="recorder" {...FADE}>
                <Card tone={phase === 'failed' ? 'error' : isActive ? 'live' : 'idle'}>
                  <div className="flex flex-col items-center gap-5 px-6 py-10">
                    <div className="relative grid h-[104px] w-[104px] place-items-center">
                      {isActive && [0, 1].map(i => (
                        <m.span
                          key={i}
                          className="absolute inset-2 rounded-full"
                          style={{ background: ACCENT }}
                          initial={{ scale: 1, opacity: 0.3 }}
                          animate={{ scale: 1.7, opacity: 0 }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: i * 0.9 }}
                        />
                      ))}
                      {(phase === 'uploading' || phase === 'processing') && (
                        <span
                          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
                          style={{ borderTopColor: ACCENT, borderRightColor: tint(ACCENT, 35) }}
                        />
                      )}
                      <m.button
                        onClick={isActive ? stopRecording : startRecording}
                        disabled={isBusy || phase === 'failed'}
                        whileHover={isBusy || phase === 'failed' ? undefined : { scale: 1.05 }}
                        whileTap={isBusy || phase === 'failed' ? undefined : { scale: 0.95 }}
                        aria-label={isActive ? 'stop recording' : 'start recording'}
                        className="relative grid h-[84px] w-[84px] place-items-center rounded-full border-2 transition-[background-color,border-color,opacity] duration-200 disabled:cursor-default disabled:opacity-45"
                        style={{
                          borderColor: ACCENT,
                          background: isActive ? ACCENT : tint(ACCENT, 10),
                          color: isActive ? '#fff8f0' : inkOf(ACCENT),
                        }}
                      >
                        {isActive ? <Square size={24} fill="currentColor" /> : <Mic size={26} />}
                      </m.button>
                    </div>

                    <div className="min-h-[3.2rem] text-center font-mono">
                      {phase === 'idle' && (
                        <p className="m-0 text-[0.78rem] text-[var(--text-faint)]">tap to record</p>
                      )}
                      {phase === 'recording' && (
                        <div>
                          <p className="m-0 mb-1 text-[1.9rem] font-medium leading-none tabular-nums tracking-[-0.02em]" style={{ color: inkOf(ACCENT) }}>
                            {formatDuration(elapsed)}
                          </p>
                          <p className="m-0 flex items-center justify-center gap-1.5 text-[0.7rem] text-[var(--text-faint)]">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: ACCENT }} />
                            recording — tap to stop
                          </p>
                        </div>
                      )}
                      {phase === 'uploading' && (
                        <p className="m-0 animate-pulse text-[0.78rem] text-[var(--text-muted)]">uploading audio...</p>
                      )}
                      {phase === 'processing' && (
                        <div>
                          <p className="m-0 mb-1 animate-pulse text-[0.78rem] text-[var(--text-muted)]">
                            transcribing... {elapsed > 0 && `(${formatDuration(elapsed)})`}
                          </p>
                          <p className="m-0 text-[0.66rem] text-[var(--text-faint)]">longer recordings may take a moment</p>
                        </div>
                      )}
                      {phase === 'failed' && (
                        <p className="m-0 max-w-[26ch] text-[0.75rem] text-[var(--accent)]">{error}</p>
                      )}
                    </div>

                    {/* Error for non-failed phases */}
                    {error && phase !== 'failed' && (
                      <p className="m-0 text-center font-mono text-xs text-[var(--accent)]">{error}</p>
                    )}

                    {phase === 'failed' && (
                      <div className="flex gap-2">
                        {jobRetryCount < 3 && (
                          <Button variant="outline" size="sm" className="font-mono text-[var(--text-muted)]" onClick={retryJob}>
                            <RefreshCw size={11} /> retry
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="font-mono text-[var(--text-faint)]" onClick={discard}>
                          <Trash2 size={11} /> discard
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </m.div>
            )}

            {/* Manual entry */}
            {tab === 'manual' && (phase === 'idle' || phase === 'analyzing') && (
              <m.div key="manual" {...FADE}>
                <Card tone="idle">
                  <textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="write freely..."
                    rows={12}
                    disabled={phase === 'analyzing'}
                    className="block w-full resize-y border-0 bg-transparent px-6 py-5 font-mono text-[0.84rem] leading-[1.75] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] disabled:opacity-50"
                    style={{ caretColor: ACCENT }}
                  />
                  <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-6 py-3">
                    <span className="font-mono text-[0.66rem] tabular-nums text-[var(--text-faint)]">
                      {manualText.trim() ? `${manualText.trim().split(/\s+/).length} words` : ''}
                    </span>
                    <Button
                      onClick={analyzeManual}
                      disabled={phase === 'analyzing' || !manualText.trim()}
                      className="font-mono text-white hover:brightness-95"
                      style={{ background: ACCENT }}
                    >
                      {phase === 'analyzing' ? 'analyzing...' : <>preview <ArrowRight size={13} /></>}
                    </Button>
                  </div>
                </Card>
              </m.div>
            )}

            {/* Preview */}
            {inPreview && (
              <m.div key="preview" {...FADE}>
                <PreviewCard
                  title={aiTitle}
                  rating={aiRating}
                  body={transcript}
                  duration={tab === 'voice' ? elapsed : undefined}
                  entryType={tab}
                  saving={phase === 'saving'}
                  onSave={() => saveEntry(tab)}
                  onReRecord={discard}
                  onDiscard={discard}
                />
              </m.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── Past entries ── */}
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--text-faint)]">past entries</span>
            {entries.length > 0 && (
              <span className="font-mono text-[0.62rem] tabular-nums text-[var(--text-faint)]">{entries.length}</span>
            )}
          </div>

          {loadingEntries && (
            <div className="flex flex-col gap-2" aria-label="loading">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-[52px] animate-pulse rounded-xl bg-[var(--bg-alt)]" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          )}
          {!loadingEntries && entries.length === 0 && (
            <p className="m-0 font-mono text-[0.78rem] text-[var(--text-faint)]">no entries yet.</p>
          )}

          <div className="flex flex-col gap-2">
            {entries.map((entry, i) => {
              const open = expanded === entry.id
              const band = entry.rating !== null ? ratingColor(entry.rating) : 'var(--border)'
              return (
                <m.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: Math.min(i, 8) * 0.035 }}
                  className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] transition-shadow"
                  style={{ borderLeft: `4px solid ${band}`, boxShadow: open ? '0 10px 24px -18px rgba(60,40,10,0.4)' : undefined }}
                >
                  <button
                    onClick={() => setExpanded(open ? null : entry.id)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-alt)]/60"
                  >
                    <span className="min-w-0 flex-1 truncate text-[0.88rem] font-medium">{entry.title}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {entry.rating !== null && (
                        <span
                          className="rounded-full px-2 py-0.5 font-mono text-[0.66rem] font-semibold tabular-nums"
                          style={{ background: tint(band, 16), color: inkOf(band) }}
                        >
                          {entry.rating}/10
                        </span>
                      )}
                      <span className="hidden items-center gap-1 rounded-full border border-[var(--border)] px-1.5 py-0.5 font-mono text-[0.6rem] text-[var(--text-faint)] sm:inline-flex">
                        {entry.entry_type === 'manual' ? <Pencil size={9} /> : <Mic size={9} />}
                        {entry.entry_type === 'manual' ? 'manual' : 'voice'}
                      </span>
                      <span className="font-mono text-[0.65rem] text-[var(--text-faint)]">
                        {entry.entry_type === 'voice' && `${formatDuration(entry.duration_seconds)} · `}{timeAgo(entry.created_at)}
                      </span>
                      <ChevronDown size={13} className={cn('text-[var(--text-faint)] transition-transform duration-200', open && 'rotate-180')} />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <m.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <p className="m-0 border-t border-[var(--border)] px-4 pb-4 pt-3 font-mono text-[0.8rem] leading-[1.75] text-[var(--text-muted)] whitespace-pre-wrap">
                          {entry.transcript}
                        </p>
                      </m.div>
                    )}
                  </AnimatePresence>
                </m.div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

/* ─────────────────────────── presentation ─────────────────────────── */

const ACCENT = TAB_COLORS.journal

const FADE = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2 },
}

function Card({ children, tone = 'idle' }: { children: React.ReactNode; tone?: 'idle' | 'live' | 'error' }) {
  return (
    <div
      className="overflow-hidden rounded-xl border bg-[var(--bg-raised)] shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_18px_40px_-28px_rgba(60,40,10,0.35)] transition-colors duration-300"
      style={{
        borderColor: tone === 'live' ? ACCENT : tone === 'error' ? 'var(--accent)' : 'var(--border)',
        backgroundImage: tone === 'live' ? `linear-gradient(180deg, ${tint(ACCENT, 9)}, transparent 70%)` : undefined,
      }}
    >
      <div className="h-[3px] w-full" style={{ background: tone === 'error' ? 'var(--accent)' : ACCENT }} />
      {children}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-xl font-medium tabular-nums leading-none" style={{ color }}>{value}</span>
      <span className="mt-1.5 text-[0.6rem] uppercase tracking-[0.12em] text-[var(--text-faint)]">{label}</span>
    </div>
  )
}

interface PreviewCardProps {
  title: string
  rating: number | null
  body: string
  duration?: number
  entryType: Tab
  saving: boolean
  onSave: () => void
  onReRecord: () => void
  onDiscard: () => void
}

function PreviewCard({ title, rating, body, duration, entryType, saving, onSave, onReRecord, onDiscard }: PreviewCardProps) {
  const rc = rating !== null ? ratingColor(rating) : null
  return (
    <div>
      <Card>
        <div className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            {entryType === 'voice' && duration !== undefined && (
              <span className="flex items-center gap-1.5 font-mono text-[0.7rem] text-[var(--text-faint)]">
                <Mic size={11} />
                {formatDuration(duration)} recording
              </span>
            )}
            {rc && rating !== null && (
              <span
                className="rounded-full px-2.5 py-0.5 font-mono text-[0.75rem] font-semibold tabular-nums"
                style={{ background: tint(rc, 16), color: inkOf(rc), boxShadow: `inset 0 0 0 1px ${tint(rc, 45)}` }}
              >
                {rating} / 10
              </span>
            )}
          </div>

          <p className="m-0 mb-3 text-[1.05rem] font-medium leading-snug tracking-[-0.01em]">{title}</p>

          <p className="m-0 max-h-[46vh] overflow-y-auto whitespace-pre-wrap font-mono text-[0.82rem] leading-[1.75] text-[var(--text-muted)]">
            {body}
          </p>
        </div>
      </Card>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          onClick={onSave}
          disabled={saving}
          className="h-11 min-w-[110px] flex-1 font-mono font-semibold text-white hover:brightness-95"
          style={{ background: ACCENT }}
        >
          <Save size={13} />
          {saving ? 'saving...' : 'save entry'}
        </Button>
        <Button variant="outline" className="h-11 font-mono text-[var(--text-muted)]" onClick={onReRecord} disabled={saving}>
          <RotateCcw size={13} />
          {entryType === 'voice' ? 're-record' : 're-write'}
        </Button>
        <Button variant="outline" className="h-11 w-11 px-0 text-[var(--text-faint)]" onClick={onDiscard} disabled={saving} title="Discard" aria-label="discard">
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  )
}

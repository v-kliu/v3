'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, Square, Save, Trash2, RotateCcw, Pencil } from 'lucide-react'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'

interface Entry {
  id: string
  created_at: string
  title: string
  transcript: string
  duration_seconds: number
  entry_type: 'voice' | 'manual'
}

type Phase = 'idle' | 'recording' | 'processing' | 'preview' | 'saving'
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
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Manual tab state
  const [manualText, setManualText] = useState('')
  const [manualTitle, setManualTitle] = useState('')
  const [manualSaving, setManualSaving] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef(0)

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/journal')
      const json = await res.json()
      if (json.entries) setEntries(json.entries)
    } catch { /* silent */ }
    finally { setLoadingEntries(false) }
  }, [])

  useEffect(() => { loadEntries() }, [loadEntries])

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
    setPhase('processing')

    const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
    const form = new FormData()
    form.append('audio', blob)

    try {
      const res = await fetch('/api/transcribe', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error || 'Transcription failed.')
        setPhase('idle')
        return
      }
      setTranscript(json.transcript)
      setTitle('')
      setElapsed(duration)
      setPhase('preview')
    } catch {
      setError('Transcription failed. Try again.')
      setPhase('idle')
    }
  }

  async function saveEntry() {
    setPhase('saving')
    try {
      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || transcript.slice(0, 60),
          transcript,
          duration_seconds: elapsed,
          entry_type: 'voice',
        }),
      })
      setPhase('idle')
      setTranscript('')
      setTitle('')
      setElapsed(0)
      loadEntries()
    } catch {
      setError('Failed to save. Try again.')
      setPhase('preview')
    }
  }

  function discard() {
    setPhase('idle')
    setTranscript('')
    setTitle('')
    setElapsed(0)
    setError('')
  }

  async function saveManualEntry() {
    if (!manualText.trim()) return
    setManualSaving(true)
    try {
      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualTitle.trim() || manualText.trim().slice(0, 60),
          transcript: manualText.trim(),
          duration_seconds: 0,
          entry_type: 'manual',
        }),
      })
      setManualText('')
      setManualTitle('')
      loadEntries()
    } catch {
      /* silent */
    } finally {
      setManualSaving(false)
    }
  }

  const isActive = phase === 'recording'
  const isProcessing = phase === 'processing' || phase === 'saving'

  return (
    <div style={{ maxWidth: '580px', width: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.3rem 0', letterSpacing: '-0.01em' }}>
          journal
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-faint)', margin: 0, fontFamily: mono }}>
          speak freely. transcribed and stored.
        </p>
      </div>

      {/* ── TAB TOGGLE ── */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.75rem', borderBottom: '1px solid var(--border)' }}>
        {(['voice', 'manual'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError('') }}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-1px',
              padding: '0.5rem 1rem',
              fontFamily: mono,
              fontSize: '0.78rem',
              color: tab === t ? 'var(--accent)' : 'var(--text-faint)',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              transition: 'color 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── VOICE TAB ── */}
      {tab === 'voice' && (
        <>
          {/* RECORDER */}
          {(phase === 'idle' || phase === 'recording' || phase === 'processing') && (
            <div style={{
              padding: '2.5rem 2rem',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              background: 'var(--bg-alt)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
              marginBottom: '2rem',
            }}>
              <button
                onClick={isActive ? stopRecording : startRecording}
                disabled={isProcessing}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  background: isActive ? 'var(--accent)' : 'transparent',
                  cursor: isProcessing ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  opacity: isProcessing ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                {isActive
                  ? <Square size={22} style={{ color: '#fff8f0' }} />
                  : <Mic size={22} style={{ color: isProcessing ? 'var(--text-faint)' : 'var(--text-muted)' }} />
                }
              </button>

              <div style={{ textAlign: 'center' }}>
                {phase === 'idle' && (
                  <p style={{ fontFamily: mono, fontSize: '0.78rem', color: 'var(--text-faint)', margin: 0 }}>
                    tap to record
                  </p>
                )}
                {phase === 'recording' && (
                  <div>
                    <p style={{ fontFamily: mono, fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)', margin: '0 0 0.2rem 0', letterSpacing: '-0.02em' }}>
                      {formatDuration(elapsed)}
                    </p>
                    <p style={{ fontFamily: mono, fontSize: '0.72rem', color: 'var(--text-faint)', margin: 0 }}>
                      recording — tap to stop
                    </p>
                  </div>
                )}
                {phase === 'processing' && (
                  <p style={{ fontFamily: mono, fontSize: '0.78rem', color: 'var(--text-faint)', margin: 0 }}>
                    transcribing...
                  </p>
                )}
              </div>

              {error && (
                <p style={{ fontFamily: mono, fontSize: '0.75rem', color: 'var(--accent)', margin: 0, textAlign: 'center' }}>
                  {error}
                </p>
              )}
            </div>
          )}

          {/* PREVIEW */}
          {(phase === 'preview' || phase === 'saving') && (
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                padding: '1.5rem',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                background: 'var(--bg-alt)',
                marginBottom: '0.75rem',
              }}>
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mic size={11} style={{ color: 'var(--text-faint)' }} />
                  <span style={{ fontFamily: mono, fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                    {formatDuration(elapsed)} recording
                  </span>
                </div>

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={transcript.slice(0, 60) || 'entry title'}
                  disabled={phase === 'saving'}
                  style={{
                    width: '100%',
                    padding: '0 0 0.5rem 0',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text)',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    outline: 'none',
                    marginBottom: '1rem',
                    boxSizing: 'border-box',
                  }}
                />

                <p style={{
                  fontFamily: mono,
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}>
                  {transcript}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={saveEntry}
                  disabled={phase === 'saving'}
                  style={{
                    flex: 1,
                    minWidth: '100px',
                    padding: '0.7rem',
                    background: 'var(--accent)',
                    color: '#fff8f0',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: phase === 'saving' ? 'default' : 'pointer',
                    fontFamily: mono,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    opacity: phase === 'saving' ? 0.6 : 1,
                  }}
                >
                  <Save size={13} />
                  {phase === 'saving' ? 'saving...' : 'save entry'}
                </button>
                <button
                  onClick={discard}
                  disabled={phase === 'saving'}
                  title="Re-record"
                  style={{
                    padding: '0.7rem 0.9rem',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontFamily: mono,
                    fontSize: '0.82rem',
                  }}
                >
                  <RotateCcw size={13} />
                  re-record
                </button>
                <button
                  onClick={discard}
                  disabled={phase === 'saving'}
                  title="Discard"
                  style={{
                    padding: '0.7rem 0.75rem',
                    background: 'transparent',
                    color: 'var(--text-faint)',
                    border: '1px solid var(--border)',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MANUAL TAB ── */}
      {tab === 'manual' && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            padding: '1.5rem',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            background: 'var(--bg-alt)',
            marginBottom: '0.75rem',
          }}>
            <input
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="title (optional)"
              style={{
                width: '100%',
                padding: '0 0 0.5rem 0',
                fontFamily: 'inherit',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text)',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                outline: 'none',
                marginBottom: '1rem',
                boxSizing: 'border-box',
              }}
            />
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="write freely..."
              rows={8}
              style={{
                width: '100%',
                fontFamily: mono,
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.7,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={saveManualEntry}
            disabled={manualSaving || !manualText.trim()}
            style={{
              padding: '0.7rem 1.5rem',
              background: 'var(--accent)',
              color: '#fff8f0',
              border: 'none',
              borderRadius: '3px',
              cursor: manualSaving || !manualText.trim() ? 'default' : 'pointer',
              fontFamily: mono,
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              opacity: manualSaving || !manualText.trim() ? 0.5 : 1,
            }}
          >
            <Save size={13} />
            {manualSaving ? 'saving...' : 'save entry'}
          </button>
        </div>
      )}

      {/* ── PAST ENTRIES ── */}
      <div>
        <p style={{ fontFamily: mono, fontSize: '0.68rem', color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 0.75rem 0' }}>
          past entries
        </p>

        {loadingEntries && (
          <p style={{ fontFamily: mono, fontSize: '0.78rem', color: 'var(--text-faint)' }}>loading...</p>
        )}

        {!loadingEntries && entries.length === 0 && (
          <p style={{ fontFamily: mono, fontSize: '0.78rem', color: 'var(--text-faint)' }}>no entries yet.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: expanded === entry.id ? 'var(--bg-alt)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.title}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                  {/* entry type tag */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontFamily: mono,
                    fontSize: '0.6rem',
                    color: 'var(--text-faint)',
                    border: '1px solid var(--border)',
                    borderRadius: '2px',
                    padding: '0.1rem 0.35rem',
                    letterSpacing: '0.03em',
                  }}>
                    {entry.entry_type === 'manual'
                      ? <Pencil size={9} />
                      : <Mic size={9} />
                    }
                    {entry.entry_type === 'manual' ? 'manual' : 'voice'}
                  </span>
                  <span style={{ fontFamily: mono, fontSize: '0.65rem', color: 'var(--text-faint)' }}>
                    {entry.entry_type === 'voice' && `${formatDuration(entry.duration_seconds)} · `}{timeAgo(entry.created_at)}
                  </span>
                </span>
              </button>

              {expanded === entry.id && (
                <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border)' }}>
                  <p style={{
                    fontFamily: mono,
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.7,
                    margin: '0.75rem 0 0 0',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {entry.transcript}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

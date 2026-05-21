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
  rating: number | null
}

type Phase = 'idle' | 'recording' | 'processing' | 'analyzing' | 'preview' | 'saving'
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

function ratingColor(r: number): string {
  if (r >= 8) return '#5a8a5a'
  if (r >= 5) return 'var(--text-muted)'
  return '#8a5a5a'
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
    setPhase('processing')

    const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
    const form = new FormData()
    form.append('audio', blob)

    let text = ''
    try {
      const res = await fetch('/api/transcribe', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error || 'Transcription failed.')
        setPhase('idle')
        return
      }
      text = json.transcript
      setElapsed(duration)
    } catch {
      setError('Transcription failed. Try again.')
      setPhase('idle')
      return
    }

    setPhase('analyzing')
    const { title, rating } = await analyze(text)
    setTranscript(text)
    setAiTitle(title)
    setAiRating(rating)
    setPhase('preview')
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
      if (entryType === 'manual') setManualText('')
      loadEntries()
    } catch {
      setError('Failed to save. Try again.')
      setPhase('preview')
    }
  }

  function discard() {
    setPhase('idle')
    setTranscript('')
    setAiTitle('')
    setAiRating(null)
    setElapsed(0)
    setError('')
  }

  const isActive = phase === 'recording'
  const isProcessing = phase === 'processing' || phase === 'saving'
  const isAnalyzing = phase === 'analyzing'
  const inPreview = phase === 'preview' || phase === 'saving'

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

      {/* Tab toggle */}
      <div style={{ display: 'flex', marginBottom: '1.75rem', borderBottom: '1px solid var(--border)' }}>
        {(['voice', 'manual'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); if (phase !== 'recording') { discard() } }}
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
          {/* Recorder */}
          {(phase === 'idle' || phase === 'recording' || phase === 'processing' || phase === 'analyzing') && (
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
                disabled={isProcessing || isAnalyzing}
                style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  background: isActive ? 'var(--accent)' : 'transparent',
                  cursor: (isProcessing || isAnalyzing) ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  opacity: (isProcessing || isAnalyzing) ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                {isActive
                  ? <Square size={22} style={{ color: '#fff8f0' }} />
                  : <Mic size={22} style={{ color: (isProcessing || isAnalyzing) ? 'var(--text-faint)' : 'var(--text-muted)' }} />
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
                {phase === 'analyzing' && (
                  <p style={{ fontFamily: mono, fontSize: '0.78rem', color: 'var(--text-faint)', margin: 0 }}>
                    extracting title & rating...
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

          {/* Preview */}
          {inPreview && (
            <PreviewCard
              title={aiTitle}
              rating={aiRating}
              body={transcript}
              duration={elapsed}
              entryType="voice"
              saving={phase === 'saving'}
              onSave={() => saveEntry('voice')}
              onReRecord={discard}
              onDiscard={discard}
            />
          )}
        </>
      )}

      {/* ── MANUAL TAB ── */}
      {tab === 'manual' && (
        <>
          {/* Textarea */}
          {(phase === 'idle' || phase === 'analyzing') && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{
                padding: '1.5rem',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                background: 'var(--bg-alt)',
                marginBottom: '0.75rem',
              }}>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="write freely..."
                  rows={10}
                  disabled={isAnalyzing}
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
                    opacity: isAnalyzing ? 0.5 : 1,
                  }}
                />
              </div>
              <button
                onClick={analyzeManual}
                disabled={isAnalyzing || !manualText.trim()}
                style={{
                  padding: '0.7rem 1.5rem',
                  background: 'var(--accent)',
                  color: '#fff8f0',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: (isAnalyzing || !manualText.trim()) ? 'default' : 'pointer',
                  fontFamily: mono,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  opacity: (isAnalyzing || !manualText.trim()) ? 0.5 : 1,
                }}
              >
                {isAnalyzing ? 'analyzing...' : 'preview →'}
              </button>
            </div>
          )}

          {/* Preview */}
          {inPreview && (
            <PreviewCard
              title={aiTitle}
              rating={aiRating}
              body={transcript}
              entryType="manual"
              saving={phase === 'saving'}
              onSave={() => saveEntry('manual')}
              onReRecord={discard}
              onDiscard={discard}
            />
          )}
        </>
      )}

      {/* Past entries */}
      <div style={{ marginTop: inPreview ? '2rem' : 0 }}>
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
            <div key={entry.id} style={{ border: '1px solid var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
              <button
                onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                style={{
                  width: '100%', padding: '0.75rem 1rem',
                  background: expanded === entry.id ? 'var(--bg-alt)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '0.75rem', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.title}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                  {entry.rating !== null && (
                    <span style={{ fontFamily: mono, fontSize: '0.68rem', fontWeight: 600, color: ratingColor(entry.rating!) }}>
                      {entry.rating}/10
                    </span>
                  )}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    fontFamily: mono, fontSize: '0.6rem', color: 'var(--text-faint)',
                    border: '1px solid var(--border)', borderRadius: '2px', padding: '0.1rem 0.35rem',
                  }}>
                    {entry.entry_type === 'manual' ? <Pencil size={9} /> : <Mic size={9} />}
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
                    fontFamily: mono, fontSize: '0.8rem', color: 'var(--text-muted)',
                    lineHeight: 1.7, margin: '0.75rem 0 0 0', whiteSpace: 'pre-wrap',
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
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        padding: '1.5rem', border: '1px solid var(--border)',
        borderRadius: '4px', background: 'var(--bg-alt)', marginBottom: '0.75rem',
      }}>
        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          {entryType === 'voice' && duration !== undefined && (
            <span style={{ fontFamily: mono, fontSize: '0.7rem', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Mic size={10} />
              {formatDuration(duration)} recording
            </span>
          )}
          {rating !== null && (
            <span style={{
              fontFamily: mono, fontSize: '0.75rem', fontWeight: 700,
              color: ratingColor(rating),
              border: `1px solid ${ratingColor(rating)}`,
              borderRadius: '3px', padding: '0.1rem 0.5rem',
            }}>
              {rating} / 10
            </span>
          )}
        </div>

        {/* AI title */}
        <p style={{
          fontSize: '1rem', fontWeight: 600, color: 'var(--text)',
          margin: '0 0 0.75rem 0', letterSpacing: '-0.01em',
        }}>
          {title}
        </p>

        {/* Transcript */}
        <p style={{
          fontFamily: mono, fontSize: '0.82rem', color: 'var(--text-muted)',
          lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap',
        }}>
          {body}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            flex: 1, minWidth: '100px', padding: '0.7rem',
            background: 'var(--accent)', color: '#fff8f0',
            border: 'none', borderRadius: '3px',
            cursor: saving ? 'default' : 'pointer',
            fontFamily: mono, fontSize: '0.85rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Save size={13} />
          {saving ? 'saving...' : 'save entry'}
        </button>
        <button
          onClick={onReRecord}
          disabled={saving}
          style={{
            padding: '0.7rem 0.9rem', background: 'transparent',
            color: 'var(--text-muted)', border: '1px solid var(--border)',
            borderRadius: '3px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontFamily: mono, fontSize: '0.82rem',
          }}
        >
          <RotateCcw size={13} />
          {entryType === 'voice' ? 're-record' : 're-write'}
        </button>
        <button
          onClick={onDiscard}
          disabled={saving}
          title="Discard"
          style={{
            padding: '0.7rem 0.75rem', background: 'transparent',
            color: 'var(--text-faint)', border: '1px solid var(--border)',
            borderRadius: '3px', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

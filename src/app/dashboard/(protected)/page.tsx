'use client'

import { useState, useEffect, useRef } from 'react'
import { Plane, Search, Shuffle } from 'lucide-react'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'

// Popular routes that are likely to have active flights throughout the day
const RANDOM_FLIGHTS = [
  'AA100', 'AA1', 'UA1', 'UA400', 'DL1', 'DL400',
  'WN1', 'B61', 'AS1', 'F91', 'NK1', 'G41',
  'BA1', 'BA177', 'LH400', 'AF1', 'EK201', 'QR1',
  'SQ1', 'CX1', 'NH1', 'JL1', 'KE1', 'OZ1',
]

interface FlightData {
  flight: { iata: string; number: string }
  airline: { name: string }
  departure: {
    iata: string
    airport: string
    scheduled: string
    actual: string | null
    estimated: string | null
  }
  arrival: {
    iata: string
    airport: string
    scheduled: string
    actual: string | null
    estimated: string | null
  }
  flight_status: string
}

type Phase = 'idle' | 'searching' | 'preview' | 'active' | 'complete'

// Estimate distance from flight duration × average cruising speed
function estimateMiles(departureActual: string, arrivalEstimated: string): number {
  const hrs = (new Date(arrivalEstimated).getTime() - new Date(departureActual).getTime()) / 3_600_000
  return Math.max(0, Math.round(hrs * 550))
}

function isAirborne(f: FlightData): boolean {
  return f.departure.actual !== null && f.arrival.actual === null
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function FlightPomodoroPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [flight, setFlight] = useState<FlightData | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [liuMiles, setLiuMiles] = useState(0)
  const savedRef = useRef(false)

  // Countdown tick
  useEffect(() => {
    if (phase !== 'active') return
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { setPhase('complete'); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  // Save session on natural completion
  useEffect(() => {
    if (phase !== 'complete' || !flight || savedRef.current) return
    savedRef.current = true
    fetch('/api/pomodoro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flight_iata: flight.flight.iata,
        origin_iata: flight.departure.iata,
        destination_iata: flight.arrival.iata,
        duration_seconds: totalSeconds,
        liu_miles: liuMiles,
        completed: true,
      }),
    }).catch(() => {})
  }, [phase, flight, liuMiles, totalSeconds])

  async function fetchFlight(num: string) {
    setPhase('searching')
    setError('')
    try {
      const res = await fetch(`/api/flight?flight=${num}`)
      const json = await res.json()

      if (!json.data || json.data.length === 0) {
        setError(`No flight found for "${num}". Try a major carrier (e.g. AA100, BA177, LH400).`)
        setPhase('idle')
        return
      }

      const f: FlightData = json.data[0]

      if (!isAirborne(f)) {
        const status = f.flight_status
        setError(
          status === 'landed'
            ? `${num} has already landed.`
            : status === 'scheduled' && !f.departure.actual
            ? `${num} hasn't departed yet.`
            : `${num} is ${status} — pick a flight currently in the air.`
        )
        setPhase('idle')
        return
      }

      const arrStr = f.arrival.estimated || f.arrival.scheduled
      const depStr = f.departure.actual || f.departure.scheduled
      if (arrStr && depStr) setLiuMiles(estimateMiles(depStr, arrStr))

      setFlight(f)
      setPhase('preview')
    } catch {
      setError('Failed to fetch flight data. Try again.')
      setPhase('idle')
    }
  }

  function handleSearch() {
    const num = input.trim().toUpperCase().replace(/\s+/g, '')
    if (!num) return
    fetchFlight(num)
  }

  function handleRandom() {
    const pick = RANDOM_FLIGHTS[Math.floor(Math.random() * RANDOM_FLIGHTS.length)]
    setInput(pick)
    fetchFlight(pick)
  }

  function handleLockIn() {
    if (!flight) return
    const arrStr = flight.arrival.estimated || flight.arrival.scheduled
    if (!arrStr) { setError('No arrival time available for this flight.'); return }
    const secs = Math.max(0, Math.floor((new Date(arrStr).getTime() - Date.now()) / 1000))
    if (secs === 0) { setError('This flight has already landed.'); return }
    savedRef.current = false
    setSecondsLeft(secs)
    setTotalSeconds(secs)
    setPhase('active')
  }

  function handleAbandon() {
    setPhase('idle')
    setFlight(null)
    setInput('')
    setError('')
    setSecondsLeft(0)
    setTotalSeconds(0)
  }

  function handleReset() {
    handleAbandon()
    savedRef.current = false
  }

  const arrStr = flight?.arrival.estimated || flight?.arrival.scheduled
  const arrivalTime = arrStr
    ? new Date(arrStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—'
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0

  return (
    <div style={{ maxWidth: '580px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.4rem',
          fontWeight: 700,
          color: 'var(--text)',
          margin: '0 0 0.3rem 0',
          letterSpacing: '-0.01em',
        }}>
          flight pomodoro
        </h1>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-faint)',
          margin: 0,
          fontFamily: mono,
        }}>
          a real flight becomes your focus session.
        </p>
      </div>

      {/* ── IDLE / SEARCHING ── */}
      {(phase === 'idle' || phase === 'searching') && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="flight number — e.g. AA100"
              disabled={phase === 'searching'}
              autoFocus
              style={{
                flex: 1,
                padding: '0.65rem 0.9rem',
                fontFamily: mono,
                fontSize: '0.88rem',
                background: 'var(--bg-alt)',
                border: '1px solid var(--border)',
                borderRadius: '3px',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSearch}
              disabled={phase === 'searching'}
              style={{
                padding: '0.65rem 1rem',
                background: phase === 'searching' ? 'var(--bg-alt)' : 'var(--accent)',
                color: phase === 'searching' ? 'var(--text-faint)' : '#fff8f0',
                border: '1px solid var(--border)',
                borderRadius: '3px',
                cursor: phase === 'searching' ? 'default' : 'pointer',
                fontFamily: mono,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Search size={13} />
              {phase === 'searching' ? 'looking...' : 'search'}
            </button>
            <button
              onClick={handleRandom}
              disabled={phase === 'searching'}
              title="Pick a random flight"
              style={{
                padding: '0.65rem 0.75rem',
                background: 'transparent',
                color: phase === 'searching' ? 'var(--text-faint)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: '3px',
                cursor: phase === 'searching' ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Shuffle size={13} />
            </button>
          </div>
          {error && (
            <p style={{
              marginTop: '0.75rem',
              fontSize: '0.78rem',
              color: 'var(--accent)',
              fontFamily: mono,
              margin: '0.75rem 0 0 0',
            }}>
              {error}
            </p>
          )}
        </div>
      )}

      {/* ── PREVIEW ── */}
      {phase === 'preview' && flight && (
        <div>
          <div style={{
            padding: '1.5rem',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            background: 'var(--bg-alt)',
            marginBottom: '0.75rem',
          }}>
            {/* Route display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  fontFamily: mono,
                  color: 'var(--text)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}>
                  {flight.departure.iata}
                </div>
                <div style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-faint)',
                  marginTop: '0.3rem',
                  maxWidth: '90px',
                }}>
                  {flight.departure.airport}
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <Plane size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  fontFamily: mono,
                  color: 'var(--text)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}>
                  {flight.arrival.iata}
                </div>
                <div style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-faint)',
                  marginTop: '0.3rem',
                  maxWidth: '90px',
                }}>
                  {flight.arrival.airport}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
            }}>
              {[
                { label: 'flight', value: flight.flight.iata },
                { label: 'lands at', value: arrivalTime },
                { label: 'liu miles', value: liuMiles > 0 ? `~${liuMiles.toLocaleString()} mi` : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{
                    fontSize: '0.62rem',
                    fontFamily: mono,
                    color: 'var(--text-faint)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: '0.25rem',
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--text)',
                    fontFamily: mono,
                  }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleLockIn}
              style={{
                flex: 1,
                padding: '0.7rem',
                background: 'var(--accent)',
                color: '#fff8f0',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontFamily: mono,
                fontSize: '0.88rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              lock in →
            </button>
            <button
              onClick={() => { setPhase('idle'); setFlight(null); setError('') }}
              style={{
                padding: '0.7rem 1rem',
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: '3px',
                cursor: 'pointer',
                fontFamily: mono,
                fontSize: '0.85rem',
              }}
            >
              back
            </button>
          </div>
        </div>
      )}

      {/* ── ACTIVE ── */}
      {phase === 'active' && flight && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '2rem',
            fontFamily: mono,
            fontSize: '0.8rem',
            color: 'var(--text-faint)',
          }}>
            <Plane size={11} />
            <span>
              {flight.departure.iata} → {flight.arrival.iata} · {flight.flight.iata} · lands {arrivalTime}
            </span>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{
              fontFamily: mono,
              fontSize: '5rem',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}>
              {formatCountdown(secondsLeft)}
            </div>
          </div>

          <div style={{
            height: '2px',
            background: 'var(--border)',
            borderRadius: '1px',
            overflow: 'hidden',
            marginBottom: '1.25rem',
          }}>
            <div style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: 'var(--accent)',
              transition: 'width 1s linear',
            }} />
          </div>

          <div style={{
            display: 'flex',
            gap: '2rem',
            marginBottom: '2.5rem',
            fontFamily: mono,
            fontSize: '0.75rem',
            color: 'var(--text-faint)',
          }}>
            <span>{formatDuration(totalSeconds - secondsLeft)} elapsed</span>
            <span>{formatDuration(secondsLeft)} remaining</span>
            {liuMiles > 0 && <span>~{liuMiles.toLocaleString()} liu miles</span>}
          </div>

          <button
            onClick={handleAbandon}
            style={{
              padding: '0.45rem 0.85rem',
              background: 'transparent',
              color: 'var(--text-faint)',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: mono,
              fontSize: '0.75rem',
            }}
          >
            abandon session
          </button>
        </div>
      )}

      {/* ── COMPLETE ── */}
      {phase === 'complete' && (
        <div>
          <div style={{
            padding: '2rem',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            background: 'var(--bg-alt)',
            marginBottom: '1rem',
          }}>
            <p style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--text)',
              margin: '0 0 0.4rem 0',
            }}>
              the plane has landed.
            </p>
            {flight && (
              <p style={{
                fontSize: '0.8rem',
                fontFamily: mono,
                color: 'var(--text-faint)',
                margin: '0 0 1.5rem 0',
              }}>
                {flight.departure.iata} → {flight.arrival.iata} · {flight.flight.iata}
              </p>
            )}
            <div style={{ display: 'flex', gap: '2.5rem' }}>
              <div>
                <div style={{
                  fontSize: '0.6rem',
                  fontFamily: mono,
                  color: 'var(--text-faint)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: '0.3rem',
                }}>
                  focused for
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  fontFamily: mono,
                  color: 'var(--text)',
                }}>
                  {formatDuration(totalSeconds)}
                </div>
              </div>
              {liuMiles > 0 && (
                <div>
                  <div style={{
                    fontSize: '0.6rem',
                    fontFamily: mono,
                    color: 'var(--text-faint)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: '0.3rem',
                  }}>
                    liu miles
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    fontFamily: mono,
                    color: 'var(--text)',
                  }}>
                    ~{liuMiles.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleReset}
            style={{
              padding: '0.6rem 1.25rem',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: mono,
              fontSize: '0.82rem',
            }}
          >
            new session
          </button>
        </div>
      )}
    </div>
  )
}

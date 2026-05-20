'use client'

import { useState, useEffect, useRef } from 'react'
import { Plane, Search, Shuffle } from 'lucide-react'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'

const RANDOM_FLIGHTS = [
  'AA100', 'AA1', 'UA1', 'UA400', 'DL1', 'DL400',
  'WN1', 'B61', 'AS1', 'F91', 'NK1', 'G41',
  'BA1', 'BA177', 'LH400', 'AF1', 'EK201', 'QR1',
  'SQ1', 'CX1', 'NH1', 'JL1', 'KE1', 'OZ1',
]

// Coordinates for common airports — used to estimate ETA from live position
const AIRPORT_COORDS: Record<string, [number, number]> = {
  ATL: [33.6407, -84.4277], LAX: [33.9425, -118.4081], ORD: [41.9742, -87.9073],
  DFW: [32.8998, -97.0403], DEN: [39.8561, -104.6737], JFK: [40.6413, -73.7781],
  SFO: [37.6213, -122.3790], SEA: [47.4502, -122.3088], LAS: [36.0840, -115.1537],
  MCO: [28.4312, -81.3081], EWR: [40.6925, -74.1687], PHX: [33.4373, -112.0078],
  IAH: [29.9902, -95.3368], MIA: [25.7959, -80.2870], BOS: [42.3656, -71.0096],
  MSP: [44.8848, -93.2223], DTW: [42.2162, -83.3554], PHL: [39.8744, -75.2424],
  LGA: [40.7772, -73.8726], BWI: [39.1774, -76.6684], DCA: [38.8521, -77.0377],
  MDW: [41.7868, -87.7522], TPA: [27.9755, -82.5332], PDX: [45.5898, -122.5951],
  SAN: [32.7338, -117.1933], HNL: [21.3245, -157.9251], ANC: [61.1743, -149.9963],
  LHR: [51.4700, -0.4543], CDG: [49.0097, 2.5479], FRA: [50.0379, 8.5622],
  AMS: [52.3105, 4.7683], MAD: [40.4983, -3.5676], BCN: [41.2971, 2.0785],
  FCO: [41.8003, 12.2389], ZRH: [47.4647, 8.5492], MUC: [48.3538, 11.7861],
  DXB: [25.2532, 55.3657], DOH: [25.2732, 51.6082], SIN: [1.3644, 103.9915],
  HKG: [22.3080, 113.9185], NRT: [35.7647, 140.3864], ICN: [37.4602, 126.4407],
  PEK: [40.0799, 116.6031], PVG: [31.1443, 121.8083], SYD: [-33.9399, 151.1753],
  MEL: [-37.6690, 144.8410], YYZ: [43.6772, -79.6306], YVR: [49.1947, -123.1842],
  GRU: [-23.4356, -46.4731], MEX: [19.4363, -99.0721], CUN: [21.0365, -86.8771],
  GVA: [46.2381, 6.1089], CPH: [55.6181, 12.6561], VIE: [48.1103, 16.5697],
  IST: [41.2608, 28.7418], CAI: [30.1127, 31.4000], JNB: [-26.1367, 28.2411],
}

interface LiveData {
  latitude: number
  longitude: number
  altitude: number
  speed_horizontal: number
  is_ground: boolean
}

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
    delay: number | null
  }
  flight_status: string
  live: LiveData | null
}

type Phase = 'idle' | 'searching' | 'preview' | 'active' | 'complete'

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Estimate seconds remaining using live position + speed + known destination coords
function estimateSecondsFromLive(live: LiveData, destIata: string): number | null {
  const coords = AIRPORT_COORDS[destIata]
  if (!coords || live.speed_horizontal <= 0) return null
  const distKm = haversineKm(live.latitude, live.longitude, coords[0], coords[1])
  return Math.round((distKm / live.speed_horizontal) * 3600)
}

// Estimate Liu Miles from flight duration × avg cruising speed (550 mph)
function estimateMiles(depStr: string, arrStr: string): number {
  const hrs = (new Date(arrStr).getTime() - new Date(depStr).getTime()) / 3_600_000
  return Math.max(0, Math.round(hrs * 550))
}

function isAirborne(f: FlightData): boolean {
  if (f.flight_status === 'active') return true
  if (f.live?.is_ground === false) return true
  return f.departure.actual !== null && f.arrival.actual === null
}

function normalizeFlightNum(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9]/g, '')
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

function playChime() {
  try {
    const ctx = new AudioContext()
    const tones = [523.25, 659.25, 783.99]
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = ctx.currentTime + i * 0.3
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.25, start + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2)
      osc.start(start)
      osc.stop(start + 1.2)
    })
  } catch { /* AudioContext not available */ }
}

const MILES_KEY = 'eve-liu-miles'

export default function FlightPomodoroPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [flight, setFlight] = useState<FlightData | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [liuMiles, setLiuMiles] = useState(0)
  const [totalMiles, setTotalMiles] = useState(0)
  const savedRef = useRef(false)

  useEffect(() => {
    const n = parseInt(localStorage.getItem(MILES_KEY) || '0', 10)
    if (!isNaN(n)) setTotalMiles(n)
  }, [])

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

  // On completion: chime + save miles + log to Supabase
  useEffect(() => {
    if (phase !== 'complete' || !flight || savedRef.current) return
    savedRef.current = true
    playChime()
    setTotalMiles((prev) => {
      const next = prev + liuMiles
      localStorage.setItem(MILES_KEY, String(next))
      return next
    })
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
        setError(
          f.arrival.actual !== null
            ? `${num} has already landed.`
            : f.flight_status === 'scheduled'
            ? `${num} hasn't departed yet.`
            : `${num} is ${f.flight_status} — try a different flight.`
        )
        setPhase('idle')
        return
      }

      // Liu Miles: use scheduled dep→arr duration × 550mph
      const depStr = f.departure.actual || f.departure.scheduled
      const arrStr = f.arrival.estimated || f.arrival.scheduled
      if (depStr && arrStr) setLiuMiles(estimateMiles(depStr, arrStr))

      setFlight(f)
      setPhase('preview')
    } catch {
      setError('Failed to fetch flight data. Try again.')
      setPhase('idle')
    }
  }

  function handleSearch() {
    const num = normalizeFlightNum(input)
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
    let secs = arrStr ? Math.floor((new Date(arrStr).getTime() - Date.now()) / 1000) : -1

    // Scheduled arrival is stale — estimate from live position + speed
    if (secs <= 0 && flight.live && !flight.live.is_ground) {
      secs = estimateSecondsFromLive(flight.live, flight.arrival.iata) ?? -1
    }

    if (secs <= 60) {
      setError('Could not determine remaining flight time. The flight may be landing soon.')
      return
    }

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
    <div style={{ maxWidth: '580px', width: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)',
          margin: '0 0 0.3rem 0', letterSpacing: '-0.01em',
        }}>
          flight pomodoro
        </h1>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.5rem', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-faint)', margin: 0, fontFamily: mono }}>
            a real flight becomes your focus session.
          </p>
          <span style={{ fontSize: '0.75rem', fontFamily: mono, color: 'var(--text-faint)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{totalMiles.toLocaleString()}</span>
            {' '}total liu miles
          </span>
        </div>
      </div>

      {/* ── IDLE / SEARCHING ── */}
      {(phase === 'idle' || phase === 'searching') && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="flight number — e.g. DL310, aa 100"
              disabled={phase === 'searching'}
              autoFocus
              style={{
                flex: 1, padding: '0.65rem 0.9rem', fontFamily: mono,
                fontSize: '0.88rem', background: 'var(--bg-alt)',
                border: '1px solid var(--border)', borderRadius: '3px',
                color: 'var(--text)', outline: 'none',
              }}
            />
            <button
              onClick={handleSearch}
              disabled={phase === 'searching'}
              style={{
                padding: '0.65rem 1rem',
                background: phase === 'searching' ? 'var(--bg-alt)' : 'var(--accent)',
                color: phase === 'searching' ? 'var(--text-faint)' : '#fff8f0',
                border: '1px solid var(--border)', borderRadius: '3px',
                cursor: phase === 'searching' ? 'default' : 'pointer',
                fontFamily: mono, fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
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
                padding: '0.65rem 0.75rem', background: 'transparent',
                color: phase === 'searching' ? 'var(--text-faint)' : 'var(--text-muted)',
                border: '1px solid var(--border)', borderRadius: '3px',
                cursor: phase === 'searching' ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              <Shuffle size={13} />
            </button>
          </div>
          {error && (
            <p style={{
              marginTop: '0.75rem', fontSize: '0.78rem',
              color: 'var(--accent)', fontFamily: mono, margin: '0.75rem 0 0 0',
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
            padding: '1.5rem', border: '1px solid var(--border)',
            borderRadius: '4px', background: 'var(--bg-alt)', marginBottom: '0.75rem',
          }}>
            {/* Route */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: mono, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {flight.departure.iata}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginTop: '0.3rem', maxWidth: '90px' }}>
                  {flight.departure.airport}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <Plane size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: mono, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {flight.arrival.iata}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginTop: '0.3rem', maxWidth: '90px' }}>
                  {flight.arrival.airport}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem',
              paddingTop: '1rem', borderTop: '1px solid var(--border)',
            }}>
              {[
                { label: 'flight', value: flight.flight.iata },
                { label: 'lands at', value: arrivalTime },
                { label: 'liu miles', value: liuMiles > 0 ? `~${liuMiles.toLocaleString()} mi` : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.62rem', fontFamily: mono, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', fontFamily: mono }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p style={{ fontSize: '0.78rem', color: 'var(--accent)', fontFamily: mono, margin: '0 0 0.75rem 0' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleLockIn}
              style={{
                flex: 1, padding: '0.7rem', background: 'var(--accent)',
                color: '#fff8f0', border: 'none', borderRadius: '3px',
                cursor: 'pointer', fontFamily: mono, fontSize: '0.88rem',
                fontWeight: 600, letterSpacing: '0.02em',
              }}
            >
              lock in →
            </button>
            <button
              onClick={() => { setPhase('idle'); setFlight(null); setError('') }}
              style={{
                padding: '0.7rem 1rem', background: 'transparent',
                color: 'var(--text-muted)', border: '1px solid var(--border)',
                borderRadius: '3px', cursor: 'pointer', fontFamily: mono, fontSize: '0.85rem',
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
            padding: '2rem', border: '1px solid var(--border)',
            borderRadius: '4px', background: 'var(--bg-alt)', marginBottom: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', fontFamily: mono, fontSize: '0.8rem', color: 'var(--text-faint)' }}>
              <Plane size={11} />
              <span>{flight.departure.iata} → {flight.arrival.iata} · {flight.flight.iata} · lands {arrivalTime}</span>
            </div>

            <div style={{ fontFamily: mono, fontSize: '4.5rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '0.75rem' }}>
              {formatCountdown(secondsLeft)}
            </div>

            <div style={{ height: '2px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--accent)', transition: 'width 1s linear' }} />
            </div>

            <div style={{ display: 'flex', gap: '2rem', fontFamily: mono, fontSize: '0.75rem', color: 'var(--text-faint)' }}>
              <span>{formatDuration(totalSeconds - secondsLeft)} elapsed</span>
              <span>{formatDuration(secondsLeft)} remaining</span>
              {liuMiles > 0 && <span>~{liuMiles.toLocaleString()} liu miles</span>}
            </div>
          </div>

          <button
            onClick={handleAbandon}
            style={{
              padding: '0.45rem 0.85rem', background: 'transparent',
              color: 'var(--text-faint)', border: '1px solid var(--border)',
              borderRadius: '3px', cursor: 'pointer', fontFamily: mono, fontSize: '0.75rem',
            }}
          >
            abandon session
          </button>
        </div>
      )}

      {/* ── COMPLETE ── */}
      {phase === 'complete' && (
        <div>
          <div style={{ padding: '2rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-alt)', marginBottom: '1rem' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.4rem 0' }}>
              the plane has landed.
            </p>
            {flight && (
              <p style={{ fontSize: '0.8rem', fontFamily: mono, color: 'var(--text-faint)', margin: '0 0 1.5rem 0' }}>
                {flight.departure.iata} → {flight.arrival.iata} · {flight.flight.iata}
              </p>
            )}
            <div style={{ display: 'flex', gap: '2.5rem' }}>
              <div>
                <div style={{ fontSize: '0.6rem', fontFamily: mono, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>focused for</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: mono, color: 'var(--text)' }}>{formatDuration(totalSeconds)}</div>
              </div>
              {liuMiles > 0 && (
                <div>
                  <div style={{ fontSize: '0.6rem', fontFamily: mono, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>liu miles</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: mono, color: 'var(--text)' }}>~{liuMiles.toLocaleString()}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '0.6rem', fontFamily: mono, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>total miles</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: mono, color: 'var(--text)' }}>{totalMiles.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <button
            onClick={handleReset}
            style={{
              padding: '0.6rem 1.25rem', background: 'transparent',
              color: 'var(--text-muted)', border: '1px solid var(--border)',
              borderRadius: '3px', cursor: 'pointer', fontFamily: mono, fontSize: '0.82rem',
            }}
          >
            new session
          </button>
        </div>
      )}
    </div>
  )
}

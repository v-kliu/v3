'use client'

import { useState, useEffect, useRef, useId } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { Plane, Search, Shuffle, ArrowRight } from 'lucide-react'
import { PALETTE } from '@/components/grit/store'
import { inkOf, tint } from '@/components/dashboard/theme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

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
    <div className="w-full max-w-[780px] pb-16 text-[var(--text)]">

      {/* Header */}
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[1.85rem] font-medium leading-none tracking-[0.14em]">flight pomodoro</h1>
          <p className="m-0 mt-2.5 font-mono text-[0.68rem] tracking-[0.08em] text-[var(--text-faint)]">
            a real flight becomes your focus session.
          </p>
        </div>
        <div className="flex font-mono">
          <Stat label="total liu miles" value={totalMiles.toLocaleString()} color={SKY} icon={<Plane size={13} />} />
        </div>
      </header>

      <AnimatePresence mode="wait" initial={false}>

        {/* ── IDLE / SEARCHING ── */}
        {(phase === 'idle' || phase === 'searching') && (
          <m.div key="search" {...FADE}>
            <Card>
              <div className="px-6 pt-7 md:px-9 md:pt-9">
                <FlightArc ambient />
              </div>
              <div className="px-6 pb-7 pt-2 md:px-9 md:pb-9">
                <p className="m-0 mb-3 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--text-faint)]">
                  pick a flight that is in the air
                </p>
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="flight number — e.g. DL310, aa 100"
                    disabled={phase === 'searching'}
                    autoFocus
                    className="h-11 bg-white/40 font-mono"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={phase === 'searching'}
                    className="h-11 px-4 font-mono text-white hover:brightness-95"
                    style={{ background: SKY }}
                  >
                    <Search size={13} />
                    {phase === 'searching' ? 'looking...' : 'search'}
                  </Button>
                  <Button
                    onClick={handleRandom}
                    disabled={phase === 'searching'}
                    variant="outline"
                    className="h-11 w-11 px-0 text-[var(--text-muted)]"
                    title="Pick a random flight"
                    aria-label="random flight"
                  >
                    <Shuffle size={14} />
                  </Button>
                </div>
                <AnimatePresence initial={false}>
                  {error && (
                    <m.p
                      key="err"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="m-0 mt-3 overflow-hidden font-mono text-xs text-[var(--accent)]"
                    >
                      {error}
                    </m.p>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </m.div>
        )}

        {/* ── PREVIEW ── */}
        {phase === 'preview' && flight && (
          <m.div key="preview" {...FADE}>
            <Card>
              <div className="p-6 md:p-9">
                <div className="mb-2 flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--text-faint)]">
                  <span>{flight.airline?.name ?? 'flight'}</span>
                  <span style={{ color: inkOf(SKY) }}>{flight.flight.iata}</span>
                </div>
                <FlightArc />
                <div className="mt-1 flex items-start justify-between gap-6">
                  <Airport code={flight.departure.iata} name={flight.departure.airport} color={DEP} />
                  <Airport code={flight.arrival.iata} name={flight.arrival.airport} color={ARR} align="right" />
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3 border-t border-dashed border-[var(--border)] pt-6 sm:grid-cols-3">
                  <Chip label="flight" value={flight.flight.iata} color={SKY} />
                  <Chip label="lands at" value={arrivalTime} color={ARR} />
                  <Chip label="liu miles" value={liuMiles > 0 ? `~${liuMiles.toLocaleString()} mi` : '—'} color={DEP} />
                </div>
              </div>
            </Card>

            <AnimatePresence initial={false}>
              {error && (
                <m.p
                  key="err"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="m-0 mt-3 overflow-hidden font-mono text-xs text-[var(--accent)]"
                >
                  {error}
                </m.p>
              )}
            </AnimatePresence>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleLockIn}
                className="h-11 flex-1 font-mono text-[0.88rem] font-semibold text-white hover:brightness-95"
                style={{ background: SKY }}
              >
                lock in <ArrowRight size={14} />
              </Button>
              <Button
                variant="outline"
                className="h-11 px-5 font-mono text-[var(--text-muted)]"
                onClick={() => { setPhase('idle'); setFlight(null); setError('') }}
              >
                back
              </Button>
            </div>
          </m.div>
        )}

        {/* ── ACTIVE ── */}
        {phase === 'active' && flight && (
          <m.div key="active" {...FADE}>
            <Card>
              <div className="p-6 md:p-9">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[0.7rem] text-[var(--text-faint)]">
                  <span className="flex items-center gap-2 rounded-full px-2.5 py-1" style={{ background: tint(SKY, 14), color: inkOf(SKY) }}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: SKY }} />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: SKY }} />
                    </span>
                    in flight
                  </span>
                  <span>{flight.departure.iata} → {flight.arrival.iata} · {flight.flight.iata} · lands {arrivalTime}</span>
                </div>

                <FlightArc progress={progress} />

                <div className="mt-2 flex items-end justify-between gap-4">
                  <div
                    className="font-mono text-[clamp(2.8rem,10vw,4.75rem)] font-medium leading-none tabular-nums tracking-[-0.04em]"
                    style={{ color: inkOf(SKY) }}
                  >
                    {formatCountdown(secondsLeft)}
                  </div>
                  <div className="pb-1 text-right font-mono text-sm tabular-nums" style={{ color: inkOf(SKY) }}>
                    {Math.round(progress * 100)}%
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3 border-t border-dashed border-[var(--border)] pt-6 sm:grid-cols-3">
                  <Chip label="elapsed" value={formatDuration(totalSeconds - secondsLeft)} color={DEP} />
                  <Chip label="remaining" value={formatDuration(secondsLeft)} color={ARR} />
                  {liuMiles > 0 && <Chip label="liu miles" value={`~${liuMiles.toLocaleString()}`} color={SKY} />}
                </div>
              </div>
            </Card>

            <Button
              variant="ghost"
              size="sm"
              className="mt-4 font-mono text-[var(--text-faint)]"
              onClick={handleAbandon}
            >
              abandon session
            </Button>
          </m.div>
        )}

        {/* ── COMPLETE ── */}
        {phase === 'complete' && (
          <m.div key="complete" {...FADE}>
            <Card>
              <div className="p-6 md:p-9">
                <p className="m-0 text-xl font-medium tracking-[0.02em]">the plane has landed.</p>
                {flight && (
                  <p className="m-0 mt-1.5 font-mono text-xs text-[var(--text-faint)]">
                    {flight.departure.iata} → {flight.arrival.iata} · {flight.flight.iata}
                  </p>
                )}
                <div className="mt-3">
                  <FlightArc progress={1} celebrate />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-dashed border-[var(--border)] pt-6 sm:grid-cols-3">
                  <Chip label="focused for" value={formatDuration(totalSeconds)} color={ARR} />
                  {liuMiles > 0 && <Chip label="liu miles" value={`~${liuMiles.toLocaleString()}`} color={DEP} />}
                  <Chip label="total miles" value={totalMiles.toLocaleString()} color={SKY} />
                </div>
              </div>
            </Card>
            <Button variant="outline" className="mt-4 h-10 px-5 font-mono text-[var(--text-muted)]" onClick={handleReset}>
              new session
            </Button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─────────────────────────── presentation ─────────────────────────── */

const SKY = PALETTE[4]   // cobalt — the flight itself
const DEP = PALETTE[1]   // marigold — where you left
const ARR = PALETTE[3]   // teal — where you land

const FADE = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22 },
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_18px_40px_-28px_rgba(0,0,0,0.18)]">
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${DEP}, ${SKY}, ${ARR})` }} />
      {children}
    </div>
  )
}

function Stat({ label, value, color, icon }: { label: string; value: string | number; color: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start sm:items-end">
      <span className="flex items-center gap-1 text-xl font-medium tabular-nums leading-none" style={{ color }}>
        {icon}{value}
      </span>
      <span className="mt-1.5 text-[0.6rem] uppercase tracking-[0.12em] text-[var(--text-faint)]">{label}</span>
    </div>
  )
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border-l-[3px] bg-white/30 py-1.5 pl-3 pr-2" style={{ borderColor: color }}>
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-[var(--text-faint)]">{label}</div>
      <div className="mt-0.5 font-mono text-[0.95rem] font-semibold tabular-nums" style={{ color: inkOf(color) }}>{value}</div>
    </div>
  )
}

function Airport({ code, name, color, align = 'left' }: { code: string; name: string; color: string; align?: 'left' | 'right' }) {
  return (
    <div className={cn('min-w-0', align === 'right' && 'text-right')}>
      <div className="font-mono text-[2rem] font-medium leading-none tracking-[-0.03em]" style={{ color: inkOf(color) }}>{code}</div>
      <div className="mt-1.5 text-[0.7rem] leading-snug text-[var(--text-faint)]">{name}</div>
    </div>
  )
}

// The flight as a drawn arc: origin on the left, destination on the right, the
// plane sits at `progress` along it. `ambient` loops a plane along it instead
// (idle screen); `celebrate` bursts confetti at the destination.
const W = 640
const H = 150
const P0 = { x: 28, y: 126 }
const P1 = { x: 320, y: -30 }
const P2 = { x: 612, y: 126 }
const ARC = `M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`
const PLANE_PATH = 'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z'

function pointOn(t: number) {
  const u = 1 - t
  const x = u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x
  const y = u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y
  const dx = 2 * u * (P1.x - P0.x) + 2 * t * (P2.x - P1.x)
  const dy = 2 * u * (P1.y - P0.y) + 2 * t * (P2.y - P1.y)
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI }
}

function PlaneGlyph() {
  // The icon's nose points up-right, so it is turned 45° to face along the path.
  return (
    <g transform="rotate(45)">
      <path
        d={PLANE_PATH}
        transform="translate(-16.8 -16.8) scale(1.4)"
        fill={SKY}
        stroke={inkOf(SKY)}
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </g>
  )
}

function FlightArc({ progress = 0, ambient = false, celebrate = false }: { progress?: number; ambient?: boolean; celebrate?: boolean }) {
  const reduce = useReducedMotion()
  const gid = useId().replace(/:/g, '')
  const clamped = Math.min(Math.max(progress, 0), 1)
  const p = pointOn(clamped)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={P0.x} y1={0} x2={P2.x} y2={0}>
            <stop offset="0" stopColor={DEP} />
            <stop offset="0.5" stopColor={SKY} />
            <stop offset="1" stopColor={ARR} />
          </linearGradient>
        </defs>

        <path d={ARC} fill="none" stroke="var(--border)" strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" />
        {!ambient && (
          <path
            d={ARC}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth={3.5}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - clamped}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        )}

        <circle cx={P0.x} cy={P0.y} r={7} fill={DEP} />
        <circle cx={P0.x} cy={P0.y} r={13} fill="none" stroke={DEP} strokeOpacity={0.3} />
        <circle cx={P2.x} cy={P2.y} r={7} fill={ARR} />
        <circle cx={P2.x} cy={P2.y} r={13} fill="none" stroke={ARR} strokeOpacity={0.3} />

        {ambient ? (
          <g>
            <g style={{ opacity: reduce ? 0 : 1 }}>
              <PlaneGlyph />
            </g>
            {!reduce && <animateMotion path={ARC} dur="9s" repeatCount="indefinite" rotate="auto" />}
          </g>
        ) : (
          <g style={{ transform: `translate(${p.x}px, ${p.y}px) rotate(${p.angle}deg)`, transition: 'transform 1s linear' }}>
            <PlaneGlyph />
          </g>
        )}
      </svg>

      {celebrate && !reduce && (
        <div
          className="pointer-events-none absolute"
          style={{ left: `${(P2.x / W) * 100}%`, top: `${(P2.y / H) * 100}%` }}
        >
          {[...PALETTE, ...PALETTE].map((c, i) => {
            const a = (i / 14) * Math.PI * 2
            const r = 46 + (i % 3) * 16
            return (
              <m.span
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full"
                style={{ background: c, left: -3, top: -3 }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: Math.cos(a) * r, y: Math.sin(a) * r - 10, opacity: 0, scale: 0.4 }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

const monoStyle: React.CSSProperties = {
  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
}

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const DOT_COLORS = [
  'rgba(0, 217, 255, 0.9)',
  'rgba(255, 59, 130, 0.9)',
  'rgba(255, 165, 0, 0.9)',
  'rgba(180, 80, 255, 0.9)',
  'rgba(255, 230, 0, 0.9)',
  'rgba(255, 100, 50, 0.9)',
  'rgba(0, 180, 255, 0.9)',
  'rgba(255, 60, 60, 0.9)',
  'rgba(200, 130, 255, 0.9)',
  'rgba(255, 200, 80, 0.9)',
  'rgba(80, 220, 255, 0.9)',
  'rgba(255, 130, 180, 0.9)',
  'rgba(140, 255, 240, 0.9)',
  'rgba(255, 80, 200, 0.9)',
  'rgba(255, 190, 40, 0.9)',
  'rgba(100, 160, 255, 0.9)',
]

function randomColor(): string {
  return DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)]
}

interface Dot {
  latitude: number
  longitude: number
  color: string
}

const DEV_DOTS: Dot[] = [
  { latitude:  37.3382, longitude: -121.8863, color: randomColor() }, // San Jose
  { latitude:  40.7128, longitude:  -74.0060, color: randomColor() }, // New York
  { latitude:  51.5074, longitude:   -0.1276, color: randomColor() }, // London
  { latitude:  48.8566, longitude:    2.3522, color: randomColor() }, // Paris
  { latitude:  35.6895, longitude:  139.6917, color: randomColor() }, // Tokyo
  { latitude: -33.8688, longitude:  151.2093, color: randomColor() }, // Sydney
  { latitude: -23.5505, longitude:  -46.6333, color: randomColor() }, // São Paulo
  { latitude:  19.0760, longitude:   72.8777, color: randomColor() }, // Mumbai
  { latitude:  55.7558, longitude:   37.6173, color: randomColor() }, // Moscow
  { latitude:  -1.2921, longitude:   36.8219, color: randomColor() }, // Nairobi
]

export default function StatsForNerds() {
  const [totalVisits, setTotalVisits] = useState<number | null>(null)
  const [visitError, setVisitError] = useState(false)
  const [dots, setDots] = useState<Dot[]>([])

  useEffect(() => {
    fetch('/api/visit', { method: 'POST' })
      .then((res) => res.json())
      .then((data: { totalVisits: number }) => setTotalVisits(data.totalVisits))
      .catch(() => setVisitError(true))
  }, [])

  useEffect(() => {
    if (import.meta.env.DEV) {
      setDots(DEV_DOTS)
      return
    }
    fetch('/api/locations')
      .then((res) => res.json())
      .then((data: { dots: Omit<Dot, 'color'>[] }) =>
        setDots(data.dots.map((d) => ({ ...d, color: randomColor() })))
      )
      .catch(() => {/* silently ignore — map still renders without dots */})
  }, [])

  const countDisplay = visitError
    ? '—'
    : totalVisits === null
      ? '...'
      : totalVisits.toLocaleString()

  return (
    <section id="stats" className="section-target section-pad">
      <h2
        style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          marginBottom: '1rem',
          marginTop: 0,
          color: 'var(--text)',
          lineHeight: 1.2,
          ...monoStyle,
        }}
      >
        stats for nerds (like me)
      </h2>

      <p style={{ ...monoStyle, fontSize: '0.85rem', color: 'var(--text-faint)', marginBottom: '1.25rem', marginTop: 0 }}>
        total visits{' '}
        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{countDisplay}</span>
        {!visitError && totalVisits !== null && ' and counting!'}
      </p>

      <div style={{ width: '580px', maxWidth: '100%', margin: '0 auto' }}>
        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 153, center: [10, 0] }}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies
                .filter((geo) => geo.properties.name !== 'Antarctica')
                .map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill: 'rgba(34, 197, 94, 0.45)',
                        stroke: 'rgba(74, 222, 128, 0.75)',
                        strokeWidth: 0.4,
                        outline: 'none',
                      },
                      hover: {
                        fill: 'rgba(34, 197, 94, 0.45)',
                        stroke: 'rgba(74, 222, 128, 0.75)',
                        strokeWidth: 0.4,
                        outline: 'none',
                      },
                      pressed: {
                        fill: 'rgba(34, 197, 94, 0.45)',
                        stroke: 'rgba(74, 222, 128, 0.75)',
                        strokeWidth: 0.4,
                        outline: 'none',
                      },
                    }}
                  />
                ))
            }
          </Geographies>
          {dots.map((dot, i) => (
            <Marker key={i} coordinates={[dot.longitude, dot.latitude]}>
              <circle r={4} fill={dot.color} stroke={dot.color.replace('0.9)', '0.35)')} strokeWidth={6} />
            </Marker>
          ))}
        </ComposableMap>
      </div>
    </section>
  )
}

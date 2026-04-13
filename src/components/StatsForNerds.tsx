import React, { useEffect, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

const monoStyle: React.CSSProperties = {
  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
}

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

export interface VisitorDot {
  longitude: number
  latitude: number
}

interface Props {
  dots?: VisitorDot[]
}

export default function StatsForNerds({ dots = [] }: Props) {
  const [totalVisits, setTotalVisits] = useState<number | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/visit', { method: 'POST' })
      .then((res) => res.json())
      .then((data: { totalVisits: number }) => setTotalVisits(data.totalVisits))
      .catch(() => setError(true))
  }, [])

  const countDisplay = error
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
        {!error && totalVisits !== null && ' and counting!'}
      </p>

      {/* World map — dots will be added here once visitor API is ready */}
      <div
        style={{
          borderRadius: '6px',
          border: '1px solid rgba(74, 222, 128, 0.15)',
          overflow: 'hidden',
          background: 'rgba(10, 12, 20, 0.6)',
          position: 'relative',
        }}
      >
        <ComposableMap
          projectionConfig={{ scale: 140, center: [10, 10] }}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: 'rgba(74, 222, 128, 0.18)',
                      stroke: 'rgba(74, 222, 128, 0.45)',
                      strokeWidth: 0.5,
                      outline: 'none',
                    },
                    hover: {
                      fill: 'rgba(74, 222, 128, 0.18)',
                      stroke: 'rgba(74, 222, 128, 0.45)',
                      strokeWidth: 0.5,
                      outline: 'none',
                    },
                    pressed: {
                      fill: 'rgba(74, 222, 128, 0.18)',
                      stroke: 'rgba(74, 222, 128, 0.45)',
                      strokeWidth: 0.5,
                      outline: 'none',
                    },
                  }}
                />
              ))
            }
          </Geographies>
          {/* Visitor dots — rendered once API returns coordinates */}
          {dots.map((dot, i) => (
            <Marker key={i} coordinates={[dot.longitude, dot.latitude]}>
              <circle r={4} fill="rgba(0, 217, 255, 0.85)" stroke="rgba(0, 217, 255, 0.3)" strokeWidth={6} />
            </Marker>
          ))}
        </ComposableMap>
      </div>
    </section>
  )
}

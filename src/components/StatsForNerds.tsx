import React, { useEffect, useState } from 'react'

const monoStyle: React.CSSProperties = {
  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
}

export default function StatsForNerds() {
  const [totalVisits, setTotalVisits] = useState<number | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/visit', { method: 'POST' })
      .then((res) => res.json())
      .then((data: { totalVisits: number }) => setTotalVisits(data.totalVisits))
      .catch(() => setError(true))
  }, [])

  return (
    <section id="stats" className="section-target section-pad">
      <h2
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginBottom: '1.25rem',
          marginTop: 0,
          color: 'var(--text)',
          lineHeight: 1.2,
        }}
      >
        stats for nerds
      </h2>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: '0.6rem',
          padding: '0.6rem 1rem',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          background: 'var(--bg-alt)',
        }}
      >
        <span style={{ ...monoStyle, fontSize: '0.75rem', color: 'var(--text-faint)' }}>
          total visits
        </span>
        <span
          style={{
            ...monoStyle,
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '-0.02em',
          }}
        >
          {error ? '—' : totalVisits === null ? '...' : totalVisits.toLocaleString()}
        </span>
      </div>

      <p
        style={{
          marginTop: '0.75rem',
          marginBottom: 0,
          fontSize: '0.8rem',
          color: 'var(--text-faint)',
          ...monoStyle,
        }}
      >
        {error
          ? 'counter unavailable'
          : totalVisits === null
            ? 'counting...'
            : 'and counting :)'}
      </p>
    </section>
  )
}

import React from 'react'

const monoStyle: React.CSSProperties = {
  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
}

interface EducationEntry {
  id: string
  institution: string
  degree: string
  period: string
  location: string
  description: string
  logo: string
}

const entries: EducationEntry[] = [
  {
    id: 'uw',
    institution: 'University of Washington',
    degree: 'B.S. Computer Science, Minor in Business Administration',
    period: 'Aug 2023 - Mar 2026',
    location: 'Seattle, WA',
    description: 'Obtained degree in 2.5 years at 20 years old. Held leadership positions in DubHacks and Theta Tau, was a TA, and was active in the startup community.',
    logo: '/images/uw_logo.png',
  },
  {
    id: 'nus',
    institution: 'National University of Singapore',
    degree: 'Study Abroad',
    period: 'Aug 2025 - Dec 2025',
    location: 'Singapore',
    description: 'Completed a university exchange at NUS to explore Asia\'s entrepreneurial ecosystem and gain a global perspective while taking computing curriculum.',
    logo: '/images/nus_logo.jpg',
  },
]

const logoWrapStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  flexShrink: 0,
  borderRadius: '6px',
  border: '1px solid var(--border)',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '3px',
}

export default function Education() {
  return (
    <section
      id="education"
      className="section-target section-pad"
    >
      <h2
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginBottom: '1.5rem',
          marginTop: 0,
          color: 'var(--text)',
          lineHeight: 1.2,
        }}
      >
        Education
      </h2>

      <div>
        {entries.map((entry) => (
          <article
            key={entry.id}
            style={{ marginBottom: '2rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}
            aria-label={`${entry.degree} at ${entry.institution}`}
          >
            <div style={logoWrapStyle}>
              <img
                src={entry.logo}
                alt=""
                aria-hidden="true"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  const parent = e.currentTarget.parentElement
                  if (parent) parent.style.display = 'none'
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <h3
                style={{
                  fontSize: '1.0rem',
                  fontWeight: 600,
                  marginBottom: '0.15rem',
                  marginTop: 0,
                  lineHeight: 1.3,
                  color: 'var(--text)',
                }}
              >
                {entry.degree}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · </span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{entry.institution}</span>
              </h3>

              <p
                style={{
                  ...monoStyle,
                  fontSize: '0.75rem',
                  color: 'var(--text-faint)',
                  marginBottom: '0.4rem',
                  marginTop: 0,
                }}
              >
                {entry.period} | {entry.location}
              </p>

              <p
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.65,
                  color: 'var(--text-muted)',
                  maxWidth: '520px',
                  marginTop: 0,
                  marginBottom: 0,
                }}
              >
                {entry.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

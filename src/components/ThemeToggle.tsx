import { useState } from 'react'
import { themes, Theme } from '../themes'

interface Props {
  current: Theme
  onChange: (theme: Theme) => void
}

export default function ThemeToggle({ current, onChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 10000 }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Change theme"
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          cursor: 'pointer',
          padding: '0.3rem 0.65rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
          letterSpacing: '0.03em',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Color swatch dot */}
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: current.vars['--accent'],
          flexShrink: 0,
          display: 'inline-block',
        }} />
        {current.name}
        <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: -1 }}
            onClick={() => setOpen(false)}
          />

          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 0.4rem)',
              right: 0,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.6rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.35rem',
              width: '220px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            {themes.map((t) => {
              const isActive = t.id === current.id
              return (
                <button
                  key={t.id}
                  onClick={() => { onChange(t); setOpen(false) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.4rem 0.5rem',
                    borderRadius: '5px',
                    border: isActive ? `1px solid ${t.vars['--accent']}` : '1px solid transparent',
                    background: isActive ? t.vars['--bg-alt'] : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {/* Mini paper swatch */}
                  <span style={{
                    width: '22px',
                    height: '16px',
                    borderRadius: '3px',
                    background: t.vars['--bg'],
                    border: `1px solid ${t.vars['--border']}`,
                    flexShrink: 0,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'inline-block',
                  }}>
                    <span style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '8px',
                      height: '8px',
                      background: t.vars['--accent'],
                      borderRadius: '2px 0 3px 0',
                    }} />
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    color: isActive ? 'var(--text)' : 'var(--text-muted)',
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
                    letterSpacing: '0.01em',
                    lineHeight: 1.2,
                  }}>
                    {t.name}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

import { Plane, Mic } from 'lucide-react'

const modules = [
  {
    icon: Plane,
    title: 'Flight Pomodoro',
    description: 'A real flight becomes your focus session. The plane lands when your work ends.',
    status: 'coming soon',
  },
  {
    icon: Mic,
    title: 'Voice Journal',
    description: 'Speak freely. Transcribed, summarized, and stored automatically.',
    status: 'coming soon',
  },
]

export default function DashboardPage() {
  return (
    <div style={{ maxWidth: '680px' }}>
      <h1 style={{
        fontSize: '1.4rem',
        fontWeight: 700,
        color: 'var(--text)',
        margin: '0 0 0.3rem 0',
        letterSpacing: '-0.01em',
      }}>
        good morning, victor.
      </h1>
      <p style={{
        fontSize: '0.88rem',
        color: 'var(--text-faint)',
        margin: '0 0 2.5rem 0',
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
      }}>
        what are we building today?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {modules.map(({ icon: Icon, title, description, status }) => (
          <div
            key={title}
            style={{
              padding: '1.25rem 1.5rem',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-alt)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              marginTop: '2px',
            }}>
              <Icon size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <h2 style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--text)',
                margin: '0 0 0.3rem 0',
              }}>
                {title}
              </h2>
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                margin: '0 0 0.6rem 0',
                lineHeight: 1.6,
              }}>
                {description}
              </p>
              <span style={{
                fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
                fontSize: '0.68rem',
                color: 'var(--text-faint)',
                letterSpacing: '0.05em',
              }}>
                {status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

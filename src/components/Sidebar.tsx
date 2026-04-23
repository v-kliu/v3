import { Github, Linkedin, Mail, Download } from 'lucide-react'

interface SidebarProps {
  activeSection: string
  onNavClick: (section: string) => void
}

const navItems = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
]

export default function Sidebar({ activeSection, onNavClick }: SidebarProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '0 1.5rem 2.5rem',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* Top spacer — pushes name down to ~35-40% from top */}
      <div style={{ flex: 1 }} />

      {/* Identity */}
      <div style={{ width: '100%' }}>
        <h1
          style={{
            fontSize: '1.45rem',
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 0.35rem 0',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          Victor Liu
        </h1>
        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--text-faint)',
            margin: 0,
            lineHeight: 1.5,
            letterSpacing: '0.02em',
          }}
        >
          engineer · founder · napper
        </p>
      </div>

      {/* Gap between name and nav */}
      <div style={{ flex: 0.4 }} />

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        style={{
          width: '100%',
        }}
      >
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {navItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <li key={item.id} style={{ marginBottom: '0.1rem' }}>
                <button
                  onClick={() => onNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.4rem 0',
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--text)' : 'var(--text-muted)',
                    textAlign: 'center',
                    width: '100%',
                    minHeight: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Space below nav */}
      <div style={{ flex: 1 }} />

      {/* Bottom: resume + socials */}
      <div
        style={{
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border)',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.85rem',
        }}
      >
        <a
          href="/files/vkliu_post_grad.pdf"
          download
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            color: 'var(--accent)',
            textDecoration: 'none',
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
            padding: '0.3rem 0.65rem',
            border: '1px solid var(--accent)',
            borderRadius: '3px',
            opacity: 0.8,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8' }}
        >
          <Download size={11} />
          Resume
        </a>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'center' }}>
          <a href="https://github.com/v-kliu" target="_blank" rel="noopener noreferrer" aria-label="GitHub"
            style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', minHeight: '32px' }}>
            <Github size={15} />
          </a>
          <a href="https://www.linkedin.com/in/vkliu/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
            style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', minHeight: '32px' }}>
            <Linkedin size={15} />
          </a>
          <a href="mailto:vkliu@uw.edu" aria-label="Email"
            style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', minHeight: '32px' }}>
            <Mail size={15} />
          </a>
        </div>

        <p style={{
          fontSize: '0.78rem',
          color: 'var(--text-faint)',
          margin: '0.5rem 0 0',
          letterSpacing: '0.01em',
        }}>
          made with ❤️ by victor
        </p>
      </div>
    </div>
  )
}

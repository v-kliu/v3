'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { m } from 'motion/react'
import { Plane, Mic, LogOut, StickyNote, TrendingUp, Flame } from 'lucide-react'
import { TAB_COLORS } from './theme'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'

const navItems = [
  { href: '/dashboard', label: 'flight', icon: Plane, color: TAB_COLORS.flight },
  { href: '/dashboard/journal', label: 'journal', icon: Mic, color: TAB_COLORS.journal },
  { href: '/dashboard/todo', label: 'todo', icon: StickyNote, color: TAB_COLORS.todo },
  { href: '/dashboard/ascend', label: '向上', icon: TrendingUp, color: TAB_COLORS.ascend },
  { href: '/dashboard/grit', label: 'grit', icon: Flame, color: TAB_COLORS.grit },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/dashboard/login')
  }

  return (
    <>
      <div className="sidebar-inner paper-crease">
        <div className="sidebar-brand">
          <p style={{
            fontFamily: mono,
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text)',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
          }}>
            eve
            <span className="sidebar-dots" aria-hidden>
              {navItems.map(n => <i key={n.href} style={{ background: n.color }} />)}
            </span>
          </p>
          <Link href="/" className="sidebar-brand-home" style={{
            fontFamily: mono,
            fontSize: '0.68rem',
            color: 'var(--text-faint)',
            textDecoration: 'none',
            letterSpacing: '0.03em',
          }}>
            ← home
          </Link>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map(({ href, label, icon: Icon, color }) => {
              const isActive = pathname === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className="nav-link"
                    aria-label={label}
                    title={label}
                    aria-current={isActive ? 'page' : undefined}
                    style={{ '--c': color } as React.CSSProperties}
                  >
                    {isActive && (
                      <m.span
                        layoutId="nav-pill"
                        className="nav-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <Icon size={14} className="nav-icon" />
                    <span className="nav-label">{label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="sidebar-logout">
          <button
            onClick={handleLogout}
            aria-label="logout"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.4rem 0.6rem',
              fontSize: '0.78rem',
              color: 'var(--text-faint)',
              fontFamily: 'inherit',
              borderRadius: '3px',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)' }}
          >
            <LogOut size={12} />
            <span className="logout-label">logout</span>
          </button>
        </div>
      </div>
    </>
  )
}

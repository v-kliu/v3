'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Plane, Mic, LogOut } from 'lucide-react'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'

const navItems = [
  { href: '/dashboard', label: 'Flight Pomodoro', icon: Plane },
  { href: '/dashboard/journal', label: 'Voice Journal', icon: Mic },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/dashboard/login')
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '2rem 1.25rem',
      borderRight: '1px solid var(--border)',
    }}
    className="paper-crease"
    >
      <div style={{ marginBottom: '2rem' }}>
        <p style={{
          fontFamily: mono,
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--text)',
          margin: '0 0 0.5rem 0',
          letterSpacing: '-0.01em',
        }}>
          eve
        </p>
        <Link href="/" style={{
          fontFamily: mono,
          fontSize: '0.68rem',
          color: 'var(--text-faint)',
          textDecoration: 'none',
          letterSpacing: '0.03em',
        }}>
          ← home
        </Link>
      </div>

      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.45rem 0.6rem',
                    borderRadius: '3px',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--text)' : 'var(--text-muted)',
                    textDecoration: 'none',
                    background: isActive ? 'var(--bg-alt)' : 'transparent',
                    border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                  }}
                >
                  <Icon size={13} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <button
        onClick={handleLogout}
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
        logout
      </button>
    </div>
  )
}

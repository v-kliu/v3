'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PALETTE } from '@/components/grit/store'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'
const EVE_COLOR = PALETTE[5]

const tabs = [
  { href: '/dashboard/eve', label: 'overview' },
  { href: '/dashboard/eve/rules', label: 'rules' },
]

export default function EveLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ width: '100%' }}>
      <nav style={{ display: 'flex', gap: '0', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        {tabs.map(tab => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                fontFamily: mono,
                fontSize: '0.72rem',
                letterSpacing: '0.06em',
                padding: '0.5rem 1rem',
                color: active ? EVE_COLOR : 'var(--text-faint)',
                textDecoration: 'none',
                borderBottom: active ? `2px solid ${EVE_COLOR}` : '2px solid transparent',
                marginBottom: '-1px',
                transition: 'color 0.15s',
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}

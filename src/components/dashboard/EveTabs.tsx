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

export default function EveTabs() {
  const pathname = usePathname()
  return (
    <nav style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '2.5rem' }}>
      {tabs.map(tab => {
        const active = pathname === tab.href
        return (
          <Link key={tab.href} href={tab.href} style={{
            fontFamily: mono,
            fontSize: '0.85rem',
            letterSpacing: '0.08em',
            padding: '0.55rem 1.25rem',
            fontWeight: active ? 700 : 400,
            color: active ? 'var(--eve-title)' : 'var(--text-muted)',
            background: active ? 'var(--eve-panel-2)' : 'transparent',
            borderRadius: '4px 4px 0 0',
            textDecoration: 'none',
            borderBottom: active ? `2px solid ${EVE_COLOR}` : '2px solid transparent',
            marginBottom: '-1px',
          }}>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SUMMARY } from '@/eve/eveData'

// Shared header for every Eve dev page: prompt line, title, meta, and tabs.

const TABS = [
  { href: '/dashboard/eve', label: 'overview' },
  { href: '/dashboard/eve/rules', label: 'rules' },
]

export default function EveHeader({ command }: { command: string }) {
  const pathname = usePathname()
  return (
    <header className="eve-header">
      <p className="eve-prompt"><b>&gt;</b> {command}</p>
      <h1 className="eve-title">eve <span className="eve-title-sub">dev</span></h1>
      <p className="eve-subtitle">Personal assistant, built in the open.</p>
      <p className="eve-meta">
        <strong>{SUMMARY.currentPhase}</strong> · updated {SUMMARY.lastUpdated}
      </p>
      <nav className="eve-tabs" aria-label="Eve dev sections">
        {TABS.map(t => (
          <Link key={t.href} href={t.href} aria-current={pathname === t.href ? 'page' : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}

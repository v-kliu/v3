import { SUMMARY } from '@/eve/eveData'

// Shared header for Eve dev: prompt line, title, meta.

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function EveHeader({ command }: { command: string }) {
  return (
    <header className="eve-header">
      <p className="eve-prompt"><b>&gt;</b> {command}</p>
      <h1 className="eve-title">eve <span className="eve-title-sub">dev</span></h1>
      <p className="eve-meta eve-faint">last updated {fmtDate(SUMMARY.lastUpdated)}</p>
    </header>
  )
}

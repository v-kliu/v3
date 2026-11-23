import { SUMMARY } from '@/eve/eveData'

// Shared header for Eve dev: prompt line, title, meta.

export default function EveHeader({ command }: { command: string }) {
  return (
    <header className="eve-header">
      <p className="eve-prompt"><b>&gt;</b> {command}</p>
      <h1 className="eve-title">eve <span className="eve-title-sub">dev</span></h1>
      <p className="eve-subtitle">Personal assistant, built in the open.</p>
      <p className="eve-meta">
        <strong>{SUMMARY.currentPhase}</strong> · updated {SUMMARY.lastUpdated}
      </p>
    </header>
  )
}

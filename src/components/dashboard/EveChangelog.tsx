'use client'

import { useCallback, useEffect, useState } from 'react'
import { CHANGELOG, REPO_URL, type ChangelogFeature, type FeatureStatus } from '@/eve/changelog'
import type { LivePR, LivePRResponse } from '@/app/api/eve/prs/route'

// Changelog: one box per feature grouped by status.
// Grouping and summaries come from src/eve/changelog.ts (written by hand).
// PR state, build status and preview links come live from /api/eve/prs, fetched on
// page load and on the refresh button. A feature with PRs is "open" while any PR is
// open and "closed" once all are merged or closed. Open PRs that no feature lists
// show up in an "unfiled" box so nothing is missed.
// Open → expanded grid. Closed / Planned → collapsible <details>.
// Styles: eve.css (.eve-feature*, .eve-pr-*).

// Classic traffic-light palette — not Night Owl tokens, which are too muted.
const STATUS_DOT: Record<FeatureStatus, string> = {
  open: '#f59e0b',   // amber
  closed: '#22c55e', // green
  planned: '#6b7280', // gray
}

const BUILD_LABEL: Record<NonNullable<LivePR['build']>, string> = {
  success: 'build passed',
  pending: 'building',
  failure: 'build failed',
}

type Live = Map<number, LivePR>

interface Row {
  feature: ChangelogFeature
  status: FeatureStatus
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function liveStatus(f: ChangelogFeature, live: Live | null): FeatureStatus {
  if (!live || f.prs.length === 0) return f.status
  const known = f.prs.map(p => live.get(p.number)).filter((p): p is LivePR => !!p)
  if (known.length === 0) return f.status
  return known.some(p => p.state === 'open') ? 'open' : 'closed'
}

function PRLine({ number, title, live }: { number: number; title: string; live: LivePR | undefined }) {
  return (
    <li>
      <a href={live?.url ?? `${REPO_URL}/pull/${number}`} target="_blank" rel="noreferrer">
        <span className="eve-feature-num">#{number}</span> {live?.title ?? title}
      </a>
      {live && (
        <span className="eve-pr-meta">
          <span className={`eve-pr-state eve-pr-${live.state}`}>{live.draft && live.state === 'open' ? 'draft' : live.state}</span>
          {live.build && <span className={`eve-pr-build eve-pr-build-${live.build}`}>{BUILD_LABEL[live.build]}</span>}
          {live.preview && <a href={live.preview} target="_blank" rel="noreferrer">preview</a>}
        </span>
      )}
    </li>
  )
}

function FeatureCard({ row, live }: { row: Row; live: Live | null }) {
  const f = row.feature
  return (
    <article className="eve-feature">
      <div className="eve-feature-head">
        <h3 className="eve-h3">{f.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0, marginLeft: 'auto' }}>
          <span className="eve-faint eve-small" style={{ whiteSpace: 'nowrap' }}>{fmtDate(f.date)}</span>
          <span style={{
            display: 'inline-block',
            width: '7px', height: '7px', borderRadius: '50%',
            background: STATUS_DOT[row.status],
            flexShrink: 0,
            verticalAlign: 'middle',
          }} />
        </div>
      </div>
      <p className="eve-muted eve-small" style={{ marginTop: '0.4rem' }}>{f.summary}</p>
      {f.prs.length > 0 ? (
        <ul className="eve-feature-prs">
          {f.prs.map(pr => <PRLine key={pr.number} number={pr.number} title={pr.title} live={live?.get(pr.number)} />)}
        </ul>
      ) : (
        <p className="eve-faint eve-small" style={{ marginTop: '0.75rem' }}>pull request pending</p>
      )}
    </article>
  )
}

function UnfiledCard({ pulls, live }: { pulls: LivePR[]; live: Live }) {
  return (
    <article className="eve-feature">
      <div className="eve-feature-head">
        <h3 className="eve-h3">Unfiled</h3>
        <span style={{
          display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%',
          background: STATUS_DOT.open, flexShrink: 0, marginLeft: 'auto',
        }} />
      </div>
      <p className="eve-muted eve-small" style={{ marginTop: '0.4rem' }}>
        Open pull requests not yet added to a feature in changelog.ts.
      </p>
      <ul className="eve-feature-prs">
        {pulls.map(p => <PRLine key={p.number} number={p.number} title={p.title} live={live.get(p.number)} />)}
      </ul>
    </article>
  )
}

function FeatureGrid({ rows, live, unfiled }: { rows: Row[]; live: Live | null; unfiled?: LivePR[] }) {
  return (
    <div className="eve-features">
      {unfiled && unfiled.length > 0 && live && <UnfiledCard pulls={unfiled} live={live} />}
      {rows.map(r => <FeatureCard key={r.feature.title} row={r} live={live} />)}
    </div>
  )
}

export default function EveChangelog() {
  const [data, setData] = useState<LivePRResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async (fresh: boolean) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/eve/prs${fresh ? '?fresh=1' : ''}`, { cache: 'no-store' })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error ?? `HTTP ${r.status}`)
      setData(json as LivePRResponse)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh(false) }, [refresh])

  const live: Live | null = data ? new Map(data.pulls.map(p => [p.number, p])) : null
  const rows: Row[] = CHANGELOG.map(feature => ({ feature, status: liveStatus(feature, live) }))
  const listed = new Set(CHANGELOG.flatMap(f => f.prs.map(p => p.number)))
  const unfiled = data ? data.pulls.filter(p => p.state === 'open' && !listed.has(p.number)) : []

  const open = rows.filter(r => r.status === 'open')
  const closed = rows.filter(r => r.status === 'closed')
  const planned = rows.filter(r => r.status === 'planned')
  const openCount = open.length + (unfiled.length > 0 ? 1 : 0)

  return (
    <section>
      <h2 className="eve-h2">Changelog</h2>
      <p className="eve-lede">
        Every feature and the pull requests behind it. Full history on{' '}
        <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>.
      </p>

      <div className="eve-pr-sync">
        <button type="button" onClick={() => refresh(true)} disabled={loading}>
          {loading ? 'checking…' : 'refresh'}
        </button>
        <span className="eve-faint eve-small">
          {error
            ? `could not reach GitHub (${error}), showing last saved status`
            : data
              ? `PR status from GitHub · checked ${ago(data.fetchedAt)}`
              : 'checking GitHub…'}
        </span>
      </div>

      {openCount > 0 && (
        <>
          <p className="eve-faint eve-small" style={{ marginBottom: '0.75rem' }}>
            open · {openCount}
          </p>
          <FeatureGrid rows={open} live={live} unfiled={unfiled} />
        </>
      )}

      {planned.length > 0 && (
        <details className="eve-disclosure" style={{ marginTop: openCount > 0 ? '1.5rem' : 0 }}>
          <summary>
            <span className="eve-when-closed">planned ({planned.length})</span>
            <span className="eve-when-open">planned ({planned.length})</span>
          </summary>
          <div style={{ marginTop: '0.75rem' }}>
            <FeatureGrid rows={planned} live={live} />
          </div>
        </details>
      )}

      {closed.length > 0 && (
        <details className="eve-disclosure" style={{ marginTop: '0.75rem' }}>
          <summary>
            <span className="eve-when-closed">closed ({closed.length})</span>
            <span className="eve-when-open">closed ({closed.length})</span>
          </summary>
          <div style={{ marginTop: '0.75rem' }}>
            <FeatureGrid rows={closed} live={live} />
          </div>
        </details>
      )}
    </section>
  )
}

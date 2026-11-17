'use client'

import { useEffect, useState } from 'react'
import type { ChangelogCommit, ChangelogPull, ChangelogResponse } from '@/app/api/eve/changelog/route'

// Live changelog: open PRs and the commits each one adds, plus a collapsible
// history of commits on main. Data comes from /api/eve/changelog.
// Styles: eve.css (.eve-entry, .eve-tag, .eve-disclosure, .eve-log).

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function dayOf(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function groupByDay(commits: ChangelogCommit[]): [string, ChangelogCommit[]][] {
  const groups = new Map<string, ChangelogCommit[]>()
  for (const c of commits) {
    const k = dayOf(c.date)
    const list = groups.get(k)
    if (list) list.push(c)
    else groups.set(k, [c])
  }
  return [...groups.entries()]
}

function Pull({ p }: { p: ChangelogPull }) {
  return (
    <article className="eve-entry">
      <div className="eve-entry-head">
        <h3 className="eve-h3">
          <a href={p.url} target="_blank" rel="noreferrer">#{p.number} {p.title}</a>
        </h3>
        {p.draft && <span className="eve-tag">draft</span>}
        <span className="eve-faint eve-small">{p.branch} · updated {ago(p.updatedAt)}</span>
      </div>
      {p.commits.length > 0 ? (
        <ul className="eve-bullets" style={{ margin: '0.85rem 0 0.5rem' }}>
          {p.commits.map(c => (
            <li key={c.sha}>
              <span className="eve-tag" style={{ marginRight: '0.5em' }}>{c.tag}</span>
              <a href={c.url} target="_blank" rel="noreferrer">{c.message}</a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="eve-faint eve-small" style={{ margin: '0.6rem 0' }}>No new commits yet.</p>
      )}
    </article>
  )
}

export default function EveChangelog() {
  const [data, setData] = useState<ChangelogResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/eve/changelog')
      .then(async r => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error ?? `HTTP ${r.status}`)
        return json as ChangelogResponse
      })
      .then(d => { if (!cancelled) setData(d) })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'failed to load') })
    return () => { cancelled = true }
  }, [])

  return (
    <section>
      <h2 className="eve-h2">Changelog</h2>
      <p className="eve-lede">
        Open pull requests and what each one adds.{' '}
        {data && <>Full history on <a href={`https://github.com/${data.repo}`} target="_blank" rel="noreferrer">GitHub</a>.</>}
      </p>

      {error && <p className="eve-faint">Could not load the changelog: {error}</p>}
      {!error && !data && <p className="eve-faint">Loading changelog…</p>}

      {data && (
        <>
          <p className="eve-faint eve-small" style={{ marginBottom: '1.25rem' }}>
            In review · {data.pulls.length} open {data.pulls.length === 1 ? 'pull request' : 'pull requests'}
          </p>
          {data.pulls.length === 0
            ? <p className="eve-muted">Nothing open right now.</p>
            : data.pulls.map(p => <Pull key={p.number} p={p} />)}

          <details className="eve-disclosure">
            <summary>
              <span className="eve-when-closed">Show commit history ({data.commits.length})</span>
              <span className="eve-when-open">Hide commit history</span>
            </summary>
            <div className="eve-log">
              {groupByDay(data.commits).map(([day, commits]) => (
                <div key={day}>
                  <div className="eve-log-day">{day} · {ago(commits[0].date)}</div>
                  <ul>
                    {commits.map(c => (
                      <li key={c.sha}>
                        <span className="eve-tag">{c.tag}</span>
                        <a href={c.url} target="_blank" rel="noreferrer" className="eve-quiet">{c.message}</a>
                        <span className="eve-sha">{c.sha}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="eve-faint eve-tiny" style={{ marginTop: '0.6rem' }}>Listed automatically from commit messages on main.</p>
          </details>
        </>
      )}
    </section>
  )
}

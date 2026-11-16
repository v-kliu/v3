'use client'

import { useEffect, useState } from 'react'
import { tint } from '@/components/dashboard/theme'
import { PALETTE } from '@/components/grit/store'
import type { ChangelogCommit, ChangelogPull, ChangelogResponse } from '@/app/api/eve/changelog/route'

// Live changelog: open PRs and the features (commits) each one adds, plus a
// collapsible history of commits on main. Data comes from /api/eve/changelog.

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'
const EVE_COLOR = PALETTE[5]

const TAG_COLOR: Record<string, string> = {
  feat: PALETTE[2],
  eve: PALETTE[5],
  fix: PALETTE[0],
  docs: PALETTE[3],
  refactor: PALETTE[4],
  chore: PALETTE[4],
  ci: PALETTE[1],
  test: PALETTE[1],
}

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

// ─── Pieces ──────────────────────────────────────────────────────────────────

function Tag({ tag }: { tag: string }) {
  const c = TAG_COLOR[tag]
  return (
    <span style={{
      fontFamily: mono,
      fontSize: '0.66rem',
      letterSpacing: '0.06em',
      padding: '0.1rem 0.4rem',
      borderRadius: 4,
      flexShrink: 0,
      minWidth: '3.4rem',
      textAlign: 'center',
      color: c ? c : 'var(--text-faint)',
      border: `1px solid ${c ? tint(c, 40) : 'var(--border)'}`,
      background: c ? tint(c, 10) : 'transparent',
    }}>
      {tag}
    </span>
  )
}

function CommitRow({ c }: { c: ChangelogCommit }) {
  return (
    <li style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: '0.65rem',
      padding: '0.3rem 0',
      fontFamily: mono,
      fontSize: '0.88rem',
    }}>
      <Tag tag={c.tag} />
      <a
        href={c.url}
        target="_blank"
        rel="noreferrer"
        style={{ color: 'var(--text)', textDecoration: 'none', flex: 1, minWidth: 0, lineHeight: 1.5 }}
      >
        {c.message}
      </a>
      <span style={{ color: 'var(--text-faint)', fontSize: '0.68rem', flexShrink: 0 }}>{c.sha}</span>
    </li>
  )
}

function PullBlock({ p }: { p: ChangelogPull }) {
  return (
    <div style={{ borderLeft: `2px solid ${tint(EVE_COLOR, 50)}`, paddingLeft: '0.9rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
        <a
          href={p.url}
          target="_blank"
          rel="noreferrer"
          style={{ fontFamily: mono, fontSize: '1rem', color: EVE_COLOR, textDecoration: 'none', fontWeight: 600 }}
        >
          #{p.number} {p.title}
        </a>
        {p.draft && (
          <span style={{ fontFamily: mono, fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-faint)' }}>
            draft
          </span>
        )}
      </div>
      <p style={{ fontFamily: mono, fontSize: '0.7rem', color: 'var(--text-faint)', margin: '0 0 0.4rem 0' }}>
        {p.branch} · {p.commits.length} {p.commits.length === 1 ? 'change' : 'changes'} · updated {ago(p.updatedAt)}
      </p>
      {p.commits.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {p.commits.map(c => <CommitRow key={c.sha} c={c} />)}
        </ul>
      )}
    </div>
  )
}

function Faint({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: mono, fontSize: '0.82rem', color: 'var(--text-faint)', margin: 0, fontStyle: 'italic' }}>
      {children}
    </p>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function EveChangelog() {
  const [data, setData] = useState<ChangelogResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

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

  const label = (text: string) => (
    <p style={{
      fontFamily: mono,
      fontSize: '0.68rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--text-faint)',
      margin: '0 0 0.8rem 0',
    }}>
      {text}
    </p>
  )

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <p style={{
          fontFamily: mono,
          fontSize: '0.78rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: EVE_COLOR,
          opacity: 0.75,
          margin: '0 0 1rem 0',
        }}>
          {'// changelog'}
        </p>
        {data && (
          <a
            href={`https://github.com/${data.repo}/pulls`}
            target="_blank"
            rel="noreferrer"
            style={{ fontFamily: mono, fontSize: '0.7rem', color: 'var(--text-faint)' }}
          >
            {data.repo} ↗
          </a>
        )}
      </div>

      {error && <Faint>could not load changelog: {error}</Faint>}
      {!error && !data && <Faint>loading changelog…</Faint>}

      {data && (
        <>
          {label(`in review · ${data.pulls.length} open ${data.pulls.length === 1 ? 'pr' : 'prs'}`)}
          {data.pulls.length === 0
            ? <div style={{ marginBottom: '1.25rem' }}><Faint>no open pull requests</Faint></div>
            : data.pulls.map(p => <PullBlock key={p.number} p={p} />)}

          <button
            type="button"
            onClick={() => setShowHistory(v => !v)}
            aria-expanded={showHistory}
            style={{
              fontFamily: mono,
              fontSize: '0.8rem',
              color: EVE_COLOR,
              background: 'transparent',
              border: `1px solid ${tint(EVE_COLOR, 40)}`,
              borderRadius: 6,
              padding: '0.4rem 0.75rem',
              cursor: 'pointer',
            }}
          >
            {showHistory ? '▾ hide' : '▸ show'} commit history ({data.commits.length})
          </button>

          {showHistory && (
            <div style={{ marginTop: '1.1rem' }}>
              {groupByDay(data.commits).map(([day, commits]) => (
                <div key={day} style={{ marginBottom: '1rem' }}>
                  <p style={{ fontFamily: mono, fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 0.2rem 0' }}>
                    {day} <span style={{ color: 'var(--text-faint)' }}>· {ago(commits[0].date)}</span>
                  </p>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {commits.map(c => <CommitRow key={c.sha} c={c} />)}
                  </ul>
                </div>
              ))}
              <p style={{ fontFamily: mono, fontSize: '0.6rem', color: 'var(--text-faint)', margin: 0 }}>
                listed automatically from commit messages on main
              </p>
            </div>
          )}
        </>
      )}
    </section>
  )
}

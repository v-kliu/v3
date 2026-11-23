import { CHANGELOG, REPO_URL, type ChangelogFeature } from '@/eve/changelog'

// Changelog: one box per feature grouped by status.
// Open → expanded grid. Closed / Planned → collapsible <details>.
// Styles: eve.css (.eve-feature*).

const STATUS_DOT: Record<string, string> = {
  open: 'var(--no-yellow)',
  closed: 'var(--no-green)',
  planned: 'var(--text-faint)',
}

function FeatureCard({ f }: { f: ChangelogFeature }) {
  return (
    <article className="eve-feature">
      <div className="eve-feature-head">
        <h3 className="eve-h3">{f.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <span className="eve-faint eve-small">{f.date}</span>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: STATUS_DOT[f.status] ?? 'var(--text-faint)',
            flexShrink: 0,
          }} />
        </div>
      </div>
      <p className="eve-muted eve-small" style={{ marginTop: '0.4rem' }}>{f.summary}</p>
      {f.prs.length > 0 ? (
        <ul className="eve-feature-prs">
          {f.prs.map(pr => (
            <li key={pr.number}>
              <a href={`${REPO_URL}/pull/${pr.number}`} target="_blank" rel="noreferrer">
                <span className="eve-feature-num">#{pr.number}</span> {pr.title}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="eve-faint eve-small" style={{ marginTop: '0.75rem' }}>pull request pending</p>
      )}
    </article>
  )
}

function FeatureGrid({ features }: { features: ChangelogFeature[] }) {
  return (
    <div className="eve-features">
      {features.map(f => <FeatureCard key={f.title} f={f} />)}
    </div>
  )
}

export default function EveChangelog() {
  const open = CHANGELOG.filter(f => f.status === 'open')
  const closed = CHANGELOG.filter(f => f.status === 'closed')
  const planned = CHANGELOG.filter(f => f.status === 'planned')

  return (
    <section>
      <h2 className="eve-h2">Changelog</h2>
      <p className="eve-lede">
        Every feature and the pull requests behind it. Full history on{' '}
        <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>.
      </p>

      {open.length > 0 && (
        <>
          <p className="eve-faint eve-small" style={{ marginBottom: '0.75rem' }}>
            open · {open.length}
          </p>
          <FeatureGrid features={open} />
        </>
      )}

      {planned.length > 0 && (
        <details className="eve-disclosure" style={{ marginTop: open.length > 0 ? '1.5rem' : 0 }}>
          <summary>
            <span className="eve-when-closed">planned ({planned.length})</span>
            <span className="eve-when-open">planned ({planned.length})</span>
          </summary>
          <div style={{ marginTop: '0.75rem' }}>
            <FeatureGrid features={planned} />
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
            <FeatureGrid features={closed} />
          </div>
        </details>
      )}
    </section>
  )
}

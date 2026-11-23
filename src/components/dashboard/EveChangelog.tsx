import { CHANGELOG, REPO_URL } from '@/eve/changelog'

// Changelog: one box per feature, with links to the pull requests that built it.
// Data: src/eve/changelog.ts (static, read only). Styles: eve.css (.eve-feature*).

export default function EveChangelog() {
  return (
    <section>
      <h2 className="eve-h2">Changelog</h2>
      <p className="eve-lede">
        Every feature and the pull requests behind it. Full history on{' '}
        <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>.
      </p>
      <div className="eve-features">
        {CHANGELOG.map(f => (
          <article key={f.title} className="eve-feature">
            <div className="eve-entry-head">
              <h3 className="eve-h3">{f.title}</h3>
              <span className="eve-faint eve-small eve-push">{f.date}</span>
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
        ))}
      </div>
    </section>
  )
}

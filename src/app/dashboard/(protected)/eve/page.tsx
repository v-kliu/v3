'use client'

import {
  SUMMARY, LEARNING_LOOP, BUILD_LOOP, PHASES, DECISIONS,
  IDEAS, EVAL_NOTE, EVAL_QUESTIONS, CONCEPTS,
  type PhaseStatus, type PipelineStep,
} from '@/eve/eveData'
import EveHeader from '@/components/dashboard/EveHeader'
import EveBg from '@/components/dashboard/EveBg'
import EveChangelog from '@/components/dashboard/EveChangelog'

// Eve dev overview. Layout only: every word on this page comes from eveData.ts.
// Styles: eve.css (components) + dashboard.css [data-eve] (tokens).

const REPO_BLOB = 'https://github.com/v-kliu/v3/blob/main/'

const STATUS_TAG: Record<PhaseStatus, string> = {
  'not started': 'eve-tag',
  'in progress': 'eve-tag eve-tag-accent',
  done: 'eve-tag eve-tag-done',
}

function Flow({ title, note, steps }: { title: string; note: string; steps: PipelineStep[] }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <p>
        <span className="eve-h3">{title}</span>
        <span className="eve-faint eve-small"> · {note}</span>
      </p>
      <ol className="eve-flow">
        {steps.map(s => (
          <li key={s.label}><b>{s.label}</b><span>{s.note}</span></li>
        ))}
      </ol>
    </div>
  )
}

export default function EvePage() {
  return (
    <div className="eve">
      <EveBg />
      <EveHeader command="eve dev --mode overview" />

      <section>
        <h2 className="eve-h2">Summary</h2>
        <p style={{ maxWidth: '82ch' }}>{SUMMARY.description}</p>
      </section>

      <hr className="eve-hr" />

      <EveChangelog />

      <hr className="eve-hr" />

      <div className="eve-grid">
        <div>
          <section className="eve-section">
            <h2 className="eve-h2">The loop</h2>
            <p className="eve-lede">How a request moves through Eve, from a message to shipped code.</p>
            <Flow title="Learning loop" note="you are involved" steps={LEARNING_LOOP} />
            <Flow title="Build loop" note="runs on its own" steps={BUILD_LOOP} />
          </section>

          <section className="eve-section">
            <h2 className="eve-h2">Roadmap</h2>
            {PHASES.map(p => (
              <article key={p.number} className="eve-entry">
                <div className="eve-entry-head">
                  <h3 className="eve-h3">Phase {p.number}</h3>
                  <span className="eve-muted">{p.title}</span>
                  <span className={`${STATUS_TAG[p.status]} eve-push`}>{p.status}</span>
                </div>
                <p className="eve-muted" style={{ margin: '0.6rem 0 0.35rem' }}>{p.description}</p>
                <p className="eve-faint eve-small">learns: {p.concept}</p>
              </article>
            ))}
          </section>

          <section className="eve-section">
            <h2 className="eve-h2">Decision log</h2>
            {DECISIONS.length === 0 ? <p className="eve-faint">No decisions yet.</p> : (
              <table className="eve-table">
                <thead>
                  <tr><th>#</th><th>Decision</th><th>Date</th><th>Summary</th></tr>
                </thead>
                <tbody>
                  {DECISIONS.map(d => (
                    <tr key={d.id}>
                      <td className="eve-faint">{d.id}</td>
                      <td><a href={REPO_BLOB + d.file} target="_blank" rel="noreferrer">{d.title}</a></td>
                      <td className="eve-faint" style={{ whiteSpace: 'nowrap' }}>{d.date}</td>
                      <td className="eve-muted">{d.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <div>
          <section className="eve-section">
            <h2 className="eve-h2">Ideas inbox</h2>
            <ul className="eve-bullets">
              {IDEAS.map((idea, i) => <li key={i} className="eve-muted">{idea}</li>)}
            </ul>
          </section>

          <section className="eve-section">
            <h2 className="eve-h2">Eval set</h2>
            <p className="eve-muted">{EVAL_NOTE}</p>
            {EVAL_QUESTIONS[0]?.question === '(placeholder)' ? (
              <p className="eve-faint eve-small" style={{ marginTop: '1rem' }}>Questions get added during phase 1.</p>
            ) : (
              <ul className="eve-rows" style={{ marginTop: '1rem' }}>
                {EVAL_QUESTIONS.map((q, i) => (
                  <li key={i}>
                    <p><span className="eve-num">{String(i + 1).padStart(2, '0')}</span> {q.question}</p>
                    <p className="eve-faint eve-small">expected: {q.expected}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="eve-section">
            <h2 className="eve-h2">Concepts learned</h2>
            <ul className="eve-rows">
              {CONCEPTS.map(c => (
                <li key={c.term}>
                  <p style={{ fontWeight: 700 }}>{c.term}</p>
                  <p className="eve-muted eve-small" style={{ marginTop: '0.2rem' }}>{c.plain}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

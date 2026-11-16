'use client'

import {
  SUMMARY,
  LEARNING_LOOP,
  BUILD_LOOP,
  PHASES,
  DECISIONS,
  IDEAS,
  EVAL_NOTE,
  EVAL_QUESTIONS,
  CONCEPTS,
  type PhaseStatus,
  type PipelineStep,
} from '@/eve/eveData'
import { PALETTE } from '@/components/grit/store'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'
const EVE_COLOR = PALETTE[5] // violet #8E5CD9

const STATUS_COLOR: Record<PhaseStatus, string> = {
  'not started': 'var(--text-faint)',
  'in progress': PALETTE[1],
  done: PALETTE[2],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: mono,
      fontSize: '0.6rem',
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: EVE_COLOR,
      margin: '0 0 0.9rem 0',
      opacity: 0.75,
    }}>
      // {children}
    </p>
  )
}

function Rule() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2.25rem 0' }} />
}

// ─── Pipeline row ─────────────────────────────────────────────────────────────

function PipelineRow({ label, steps, color }: { label: string; steps: PipelineStep[]; color: string }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <p style={{
        fontFamily: mono,
        fontSize: '0.6rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-faint)',
        margin: '0 0 0.65rem 0',
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0', alignItems: 'stretch' }}>
        {steps.map((step, i) => (
          <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              title={step.note}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.18rem',
                background: 'rgba(139,92,246,0.07)',
                border: `1px solid rgba(139,92,246,0.22)`,
                borderRadius: '4px',
                padding: '0.5rem 0.9rem',
              }}
            >
              <span style={{ fontFamily: mono, fontSize: '0.75rem', fontWeight: 600, color }}>
                {step.label}
              </span>
              <span style={{ fontFamily: mono, fontSize: '0.58rem', color: 'var(--text-faint)' }}>
                {step.note}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span style={{
                fontFamily: mono,
                fontSize: '0.65rem',
                color: 'var(--text-faint)',
                padding: '0 0.4rem',
                flexShrink: 0,
              }}>→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Phase card ───────────────────────────────────────────────────────────────

function PhaseCard({ phase }: { phase: (typeof import('@/eve/eveData').PHASES)[number] }) {
  const c = STATUS_COLOR[phase.status]
  return (
    <div style={{
      borderLeft: `2px solid ${c}`,
      paddingLeft: '1rem',
      marginBottom: '1.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: mono, fontSize: '0.65rem', fontWeight: 700, color: EVE_COLOR, letterSpacing: '0.04em' }}>
          phase {phase.number}
        </span>
        <span style={{ fontFamily: mono, fontSize: '0.88rem', color: 'var(--text)' }}>
          {phase.title}
        </span>
        <span style={{
          fontFamily: mono,
          fontSize: '0.57rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: c,
          marginLeft: 'auto',
        }}>
          {phase.status}
        </span>
      </div>
      <p style={{ fontFamily: mono, fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0 0 0.3rem 0', lineHeight: 1.6 }}>
        {phase.description}
      </p>
      <p style={{ fontFamily: mono, fontSize: '0.6rem', color: 'var(--text-faint)', margin: 0 }}>
        learns: {phase.concept}
      </p>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EvePage() {
  return (
    <div style={{ width: '100%', paddingBottom: '4rem', color: 'var(--text)' }}>

      {/* Terminal-style header */}
      <header style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <p style={{
          fontFamily: mono,
          fontSize: '0.65rem',
          color: 'var(--text-faint)',
          margin: '0 0 0.6rem 0',
          letterSpacing: '0.08em',
        }}>
          {'>'} eve --mode build-dashboard --status active
        </p>
        <h1 style={{
          fontFamily: mono,
          fontSize: '2rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          margin: '0 0 0.3rem 0',
          color: EVE_COLOR,
        }}>
          eve
        </h1>
        <p style={{ fontFamily: mono, fontSize: '0.68rem', color: 'var(--text-faint)', margin: '0 0 1.1rem 0', letterSpacing: '0.06em' }}>
          personal assistant / build dashboard
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Tag label="phase" value={SUMMARY.currentPhase} />
          <Tag label="updated" value={SUMMARY.lastUpdated} />
        </div>
      </header>

      {/* Two-column grid for wider layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: '0 3rem' }}>

        {/* LEFT column */}
        <div>

          {/* Summary */}
          <section style={{ marginBottom: '2rem' }}>
            <Label>summary</Label>
            <p style={{
              fontFamily: mono,
              fontSize: '0.8rem',
              lineHeight: 1.7,
              color: 'var(--text-muted)',
              margin: 0,
              borderLeft: `2px solid rgba(139,92,246,0.3)`,
              paddingLeft: '1rem',
            }}>
              {SUMMARY.description}
            </p>
          </section>

          <Rule />

          {/* The loop */}
          <section style={{ marginBottom: '2rem' }}>
            <Label>the loop</Label>
            <PipelineRow label="learning loop — you are involved" steps={LEARNING_LOOP} color={EVE_COLOR} />
            <PipelineRow label="build loop — runs on its own" steps={BUILD_LOOP} color={PALETTE[2]} />
          </section>

          <Rule />

          {/* Roadmap */}
          <section style={{ marginBottom: '2rem' }}>
            <Label>roadmap</Label>
            {PHASES.map(p => <PhaseCard key={p.number} phase={p} />)}
          </section>

          <Rule />

          {/* Decision log */}
          <section>
            <Label>decision log</Label>
            {DECISIONS.length === 0 ? (
              <Muted>no decisions yet</Muted>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: mono, fontSize: '0.76rem' }}>
                <thead>
                  <tr>
                    {['#', 'title', 'date', 'summary'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left',
                        padding: '0 0.75rem 0.5rem 0',
                        fontSize: '0.58rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--text-faint)',
                        fontWeight: 400,
                        borderBottom: '1px solid var(--border)',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DECISIONS.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.6rem 0.75rem 0.6rem 0', color: EVE_COLOR, whiteSpace: 'nowrap' }}>{d.id}</td>
                      <td style={{ padding: '0.6rem 0.75rem 0.6rem 0', color: 'var(--text)' }}>{d.title}</td>
                      <td style={{ padding: '0.6rem 0.75rem 0.6rem 0', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>{d.date}</td>
                      <td style={{ padding: '0.6rem 0 0.6rem 0', color: 'var(--text-muted)' }}>{d.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

        </div>

        {/* RIGHT column */}
        <div>

          {/* Ideas inbox */}
          <section style={{ marginBottom: '2rem' }}>
            <Label>ideas inbox</Label>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {IDEAS.map((idea, i) => (
                <li key={i} style={{
                  fontFamily: mono,
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  gap: '0.65rem',
                  alignItems: 'baseline',
                }}>
                  <span style={{ color: EVE_COLOR, flexShrink: 0, fontSize: '0.6rem', opacity: 0.6 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {idea}
                </li>
              ))}
            </ul>
          </section>

          <Rule />

          {/* Eval set */}
          <section style={{ marginBottom: '2rem' }}>
            <Label>eval set</Label>
            <p style={{
              fontFamily: mono,
              fontSize: '0.74rem',
              lineHeight: 1.65,
              color: 'var(--text-faint)',
              margin: '0 0 1rem 0',
            }}>
              {EVAL_NOTE}
            </p>
            {EVAL_QUESTIONS[0]?.question === '(placeholder)' ? (
              <Muted>questions added during phase 1</Muted>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {EVAL_QUESTIONS.map((q, i) => (
                  <li key={i} style={{ fontFamily: mono, fontSize: '0.76rem', padding: '0.55rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--text)', marginBottom: '0.2rem' }}>
                      <span style={{ color: 'var(--text-faint)', marginRight: '0.5rem', fontSize: '0.62rem' }}>{String(i + 1).padStart(2, '0')}</span>
                      {q.question}
                    </div>
                    <div style={{ color: 'var(--text-faint)', fontSize: '0.65rem', paddingLeft: '1.4rem' }}>
                      expected: {q.expected}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Rule />

          {/* Concepts learned */}
          <section>
            <Label>concepts learned</Label>
            {CONCEPTS.map(c => (
              <div key={c.term} style={{
                padding: '0.6rem 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{
                  fontFamily: mono,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: EVE_COLOR,
                  display: 'block',
                  marginBottom: '0.2rem',
                }}>
                  {c.term}
                </span>
                <span style={{ fontFamily: mono, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  {c.plain}
                </span>
              </div>
            ))}
          </section>

        </div>
      </div>
    </div>
  )
}

// ─── Small shared components ─────────────────────────────────────────────────

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      fontFamily: mono,
      fontSize: '0.68rem',
      display: 'flex',
      gap: '0.4rem',
      alignItems: 'center',
    }}>
      <span style={{ color: 'var(--text-faint)' }}>{label}:</span>
      <span style={{ color: EVE_COLOR, fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: mono, fontSize: '0.7rem', color: 'var(--text-faint)', margin: 0 }}>
      {children}
    </p>
  )
}

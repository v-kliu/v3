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
import { inkOf, tint } from '@/components/dashboard/theme'
import { PALETTE } from '@/components/grit/store'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'
const EVE_COLOR = PALETTE[5] // violet

const STATUS_COLOR: Record<PhaseStatus, string> = {
  'not started': 'var(--text-faint)',
  'in progress': PALETTE[1], // marigold
  done: PALETTE[2],           // moss
}

const STATUS_LABEL: Record<PhaseStatus, string> = {
  'not started': 'not started',
  'in progress': 'in progress',
  done: 'done',
}

// ─── Layout helpers ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: mono,
      fontSize: '0.6rem',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--text-faint)',
      margin: '0 0 1.1rem 0',
    }}>
      {children}
    </p>
  )
}

function Divider() {
  return (
    <hr style={{
      border: 'none',
      borderTop: '1px dashed var(--border)',
      margin: '2.5rem 0',
    }} />
  )
}

// ─── Pipeline ────────────────────────────────────────────────────────────────

function PipelineRow({ label, steps, color }: { label: string; steps: PipelineStep[]; color: string }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <p style={{
        fontFamily: mono,
        fontSize: '0.62rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: inkOf(color),
        margin: '0 0 0.65rem 0',
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
        {steps.map((step, i) => (
          <>
            <div
              key={step.label}
              title={step.note}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                background: tint(color, 10),
                border: `1px solid ${tint(color, 30)}`,
                borderRadius: '6px',
                padding: '0.45rem 0.75rem',
              }}
            >
              <span style={{
                fontFamily: mono,
                fontSize: '0.78rem',
                fontWeight: 600,
                color: inkOf(color),
              }}>
                {step.label}
              </span>
              <span style={{
                fontFamily: mono,
                fontSize: '0.6rem',
                color: 'var(--text-faint)',
              }}>
                {step.note}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span key={`arrow-${i}`} style={{
                fontFamily: mono,
                fontSize: '0.75rem',
                color: 'var(--text-faint)',
                flexShrink: 0,
              }}>
                →
              </span>
            )}
          </>
        ))}
      </div>
    </div>
  )
}

// ─── Roadmap ─────────────────────────────────────────────────────────────────

function PhaseCard({ phase }: { phase: (typeof import('@/eve/eveData').PHASES)[number] }) {
  const c = STATUS_COLOR[phase.status]
  return (
    <div style={{
      borderLeft: `3px solid ${c}`,
      paddingLeft: '1rem',
      marginBottom: '1.4rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginBottom: '0.3rem' }}>
        <span style={{
          fontFamily: mono,
          fontSize: '0.68rem',
          fontWeight: 700,
          color: inkOf(EVE_COLOR),
          letterSpacing: '0.03em',
        }}>
          Phase {phase.number}
        </span>
        <span style={{
          fontFamily: mono,
          fontSize: '0.9rem',
          color: 'var(--text)',
        }}>
          {phase.title}
        </span>
        <span style={{
          fontFamily: mono,
          fontSize: '0.58rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: c,
          marginLeft: 'auto',
        }}>
          {STATUS_LABEL[phase.status]}
        </span>
      </div>
      <p style={{
        fontFamily: mono,
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        margin: '0 0 0.35rem 0',
        lineHeight: 1.55,
      }}>
        {phase.description}
      </p>
      <p style={{
        fontFamily: mono,
        fontSize: '0.62rem',
        color: 'var(--text-faint)',
        margin: 0,
        letterSpacing: '0.03em',
      }}>
        concept: {phase.concept}
      </p>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EvePage() {
  return (
    <div style={{ maxWidth: 780, paddingBottom: '4rem', color: 'var(--text)' }}>

      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: mono,
          fontSize: '1.85rem',
          fontWeight: 500,
          letterSpacing: '0.14em',
          margin: '0 0 0.5rem 0',
          color: inkOf(EVE_COLOR),
        }}>
          eve
        </h1>
        <p style={{
          fontFamily: mono,
          fontSize: '0.68rem',
          letterSpacing: '0.08em',
          color: 'var(--text-faint)',
          margin: 0,
        }}>
          personal assistant — build dashboard
        </p>
      </header>

      {/* 1. Summary */}
      <section>
        <SectionLabel>summary</SectionLabel>
        <p style={{
          fontFamily: mono,
          fontSize: '0.82rem',
          lineHeight: 1.65,
          color: 'var(--text)',
          margin: '0 0 1.1rem 0',
        }}>
          {SUMMARY.description}
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Chip label="current phase" value={SUMMARY.currentPhase} color={EVE_COLOR} />
          <Chip label="last updated" value={SUMMARY.lastUpdated} color={PALETTE[3]} />
        </div>
      </section>

      <Divider />

      {/* 2. The loop */}
      <section>
        <SectionLabel>the loop</SectionLabel>
        <PipelineRow label="learning loop — you are involved" steps={LEARNING_LOOP} color={PALETTE[4]} />
        <PipelineRow label="build loop — runs on its own" steps={BUILD_LOOP} color={PALETTE[2]} />
      </section>

      <Divider />

      {/* 3. Roadmap */}
      <section>
        <SectionLabel>roadmap</SectionLabel>
        {PHASES.map(p => <PhaseCard key={p.number} phase={p} />)}
      </section>

      <Divider />

      {/* 4. Decision log */}
      <section>
        <SectionLabel>decision log</SectionLabel>
        {DECISIONS.length === 0 ? (
          <Empty>no decisions recorded yet</Empty>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: mono, fontSize: '0.78rem' }}>
            <thead>
              <tr>
                {['#', 'title', 'date', 'summary'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '0 0.75rem 0.5rem 0',
                    fontSize: '0.6rem',
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
                <tr key={d.id}>
                  <td style={{ padding: '0.65rem 0.75rem 0.65rem 0', color: inkOf(EVE_COLOR), whiteSpace: 'nowrap' }}>
                    {d.id}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem 0.65rem 0', color: 'var(--text)' }}>
                    {d.title}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem 0.65rem 0', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                    {d.date}
                  </td>
                  <td style={{ padding: '0.65rem 0 0.65rem 0', color: 'var(--text-muted)' }}>
                    {d.summary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Divider />

      {/* 5. Ideas inbox */}
      <section>
        <SectionLabel>ideas inbox</SectionLabel>
        {IDEAS.length === 0 ? (
          <Empty>no ideas yet</Empty>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {IDEAS.map((idea, i) => (
              <li key={i} style={{
                fontFamily: mono,
                fontSize: '0.78rem',
                color: 'var(--text)',
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'baseline',
              }}>
                <span style={{ color: 'var(--text-faint)', flexShrink: 0, fontSize: '0.65rem' }}>{String(i + 1).padStart(2, '0')}</span>
                {idea}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Divider />

      {/* 6. Eval set */}
      <section>
        <SectionLabel>eval set</SectionLabel>
        <p style={{
          fontFamily: mono,
          fontSize: '0.78rem',
          lineHeight: 1.6,
          color: 'var(--text-muted)',
          margin: '0 0 1.25rem 0',
        }}>
          {EVAL_NOTE}
        </p>
        {EVAL_QUESTIONS[0]?.question === '(placeholder)' ? (
          <Empty>eval questions will be added during Phase 1</Empty>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {EVAL_QUESTIONS.map((q, i) => (
              <li key={i} style={{
                fontFamily: mono,
                fontSize: '0.78rem',
                padding: '0.6rem 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ color: 'var(--text)', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-faint)', marginRight: '0.5rem', fontSize: '0.65rem' }}>{String(i + 1).padStart(2, '0')}</span>
                  {q.question}
                </div>
                <div style={{ color: 'var(--text-faint)', fontSize: '0.68rem', paddingLeft: '1.5rem' }}>
                  expected: {q.expected}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Divider />

      {/* 7. Concepts learned */}
      <section>
        <SectionLabel>concepts learned</SectionLabel>
        {CONCEPTS.map(c => (
          <div key={c.term} style={{
            display: 'flex',
            gap: '1.25rem',
            padding: '0.65rem 0',
            borderBottom: '1px solid var(--border)',
            alignItems: 'baseline',
            flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: mono,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: inkOf(EVE_COLOR),
              minWidth: '10rem',
              flexShrink: 0,
            }}>
              {c.term}
            </span>
            <span style={{
              fontFamily: mono,
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: 1.55,
            }}>
              {c.plain}
            </span>
          </div>
        ))}
      </section>

    </div>
  )
}

// ─── Small shared components ─────────────────────────────────────────────────

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      borderLeft: '3px solid',
      borderColor: color,
      background: tint(color, 8),
      borderRadius: '0 6px 6px 0',
      padding: '0.4rem 0.75rem',
    }}>
      <div style={{ fontFamily: mono, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>
        {label}
      </div>
      <div style={{ fontFamily: mono, fontSize: '0.82rem', fontWeight: 600, color: inkOf(color) }}>
        {value}
      </div>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: mono, fontSize: '0.72rem', color: 'var(--text-faint)', margin: 0, fontStyle: 'italic' }}>
      {children}
    </p>
  )
}

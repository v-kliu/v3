'use client'

import {
  SUMMARY, LEARNING_LOOP, BUILD_LOOP, PHASES, DECISIONS,
  IDEAS, EVAL_NOTE, EVAL_QUESTIONS, CONCEPTS,
  type PhaseStatus, type PipelineStep,
} from '@/eve/eveData'
import { PALETTE } from '@/components/grit/store'
import EveTabs from '@/components/dashboard/EveTabs'
import EveBg from '@/components/dashboard/EveBg'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'
const EVE_COLOR = PALETTE[5]

const STATUS_COLOR: Record<PhaseStatus, string> = {
  'not started': 'var(--text-faint)',
  'in progress': PALETTE[1],
  done: PALETTE[2],
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: mono, fontSize: '0.78rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: EVE_COLOR, margin: '0 0 1rem 0', opacity: 0.75 }}>
      {`// ${children}`}
    </p>
  )
}

function Rule() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2.5rem 0' }} />
}

function PipelineRow({ label, steps, color }: { label: string; steps: PipelineStep[]; color: string }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <p style={{ fontFamily: mono, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)', margin: '0 0 0.75rem 0' }}>
        {label}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0', alignItems: 'stretch' }}>
        {steps.map((step, i) => (
          <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
            <div title={step.note} style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: '4px', padding: '0.55rem 1rem' }}>
              <span style={{ fontFamily: mono, fontSize: '0.88rem', fontWeight: 600, color, display: 'block' }}>{step.label}</span>
              <span style={{ fontFamily: mono, fontSize: '0.68rem', color: 'var(--text-faint)' }}>{step.note}</span>
            </div>
            {i < steps.length - 1 && (
              <span style={{ fontFamily: mono, fontSize: '0.75rem', color: 'var(--text-faint)', padding: '0 0.5rem', flexShrink: 0 }}>→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PhaseCard({ phase }: { phase: (typeof PHASES)[number] }) {
  const c = STATUS_COLOR[phase.status]
  return (
    <div style={{ borderLeft: '2px solid', borderColor: c, paddingLeft: '1rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: mono, fontSize: '0.72rem', fontWeight: 700, color: EVE_COLOR, letterSpacing: '0.04em' }}>phase {phase.number}</span>
        <span style={{ fontFamily: mono, fontSize: '1rem', color: 'var(--text)' }}>{phase.title}</span>
        <span style={{ fontFamily: mono, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: c, marginLeft: 'auto' }}>{phase.status}</span>
      </div>
      <p style={{ fontFamily: mono, fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 0.35rem 0', lineHeight: 1.6 }}>{phase.description}</p>
      <p style={{ fontFamily: mono, fontSize: '0.68rem', color: 'var(--text-faint)', margin: 0 }}>learns: {phase.concept}</p>
    </div>
  )
}

export default function EvePage() {
  return (
    <div style={{ width: '100%', paddingBottom: '4rem', color: 'var(--text)', position: 'relative', zIndex: 1 }}>
      <EveBg />

      <header style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontFamily: mono, fontSize: '0.72rem', color: 'var(--text-faint)', margin: '0 0 0.6rem 0', letterSpacing: '0.08em' }}>
          {'>'} eve --mode build-dashboard --status active
        </p>
        <h1 style={{ fontFamily: mono, fontSize: '2.2rem', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 0.3rem 0', color: EVE_COLOR }}>eve</h1>
        <p style={{ fontFamily: mono, fontSize: '0.75rem', color: 'var(--text-faint)', margin: '0 0 1.1rem 0', letterSpacing: '0.06em' }}>personal assistant / build dashboard</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Tag label="phase" value={SUMMARY.currentPhase} />
          <Tag label="updated" value={SUMMARY.lastUpdated} />
        </div>
      </header>

      <EveTabs />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: '0 3rem' }}>

        <div>
          <section style={{ marginBottom: '2rem' }}>
            <Label>summary</Label>
            <p style={{ fontFamily: mono, fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text-muted)', margin: 0, borderLeft: '2px solid rgba(139,92,246,0.3)', paddingLeft: '1rem' }}>
              {SUMMARY.description}
            </p>
          </section>

          <Rule />

          <section style={{ marginBottom: '2rem' }}>
            <Label>the loop</Label>
            <PipelineRow label="learning loop — you are involved" steps={LEARNING_LOOP} color={EVE_COLOR} />
            <PipelineRow label="build loop — runs on its own" steps={BUILD_LOOP} color={PALETTE[2]} />
          </section>

          <Rule />

          <section style={{ marginBottom: '2rem' }}>
            <Label>roadmap</Label>
            {PHASES.map(p => <PhaseCard key={p.number} phase={p} />)}
          </section>

          <Rule />

          <section>
            <Label>decision log</Label>
            {DECISIONS.length === 0 ? <Muted>no decisions yet</Muted> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: mono, fontSize: '0.88rem' }}>
                <thead>
                  <tr>
                    {['#', 'title', 'date', 'summary'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0 0.75rem 0.5rem 0', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-faint)', fontWeight: 400, borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DECISIONS.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.65rem 0.75rem 0.65rem 0', color: EVE_COLOR, whiteSpace: 'nowrap' }}>{d.id}</td>
                      <td style={{ padding: '0.65rem 0.75rem 0.65rem 0', color: 'var(--text)' }}>{d.title}</td>
                      <td style={{ padding: '0.65rem 0.75rem 0.65rem 0', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>{d.date}</td>
                      <td style={{ padding: '0.65rem 0 0.65rem 0', color: 'var(--text-muted)' }}>{d.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <div>
          <section style={{ marginBottom: '2rem' }}>
            <Label>ideas inbox</Label>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {IDEAS.map((idea, i) => (
                <li key={i} style={{ fontFamily: mono, fontSize: '0.88rem', color: 'var(--text-muted)', padding: '0.55rem 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'baseline', lineHeight: 1.5 }}>
                  <span style={{ color: EVE_COLOR, opacity: 0.5, flexShrink: 0, fontSize: '0.68rem' }}>{String(i + 1).padStart(2, '0')}</span>
                  {idea}
                </li>
              ))}
            </ul>
          </section>

          <Rule />

          <section style={{ marginBottom: '2rem' }}>
            <Label>eval set</Label>
            <p style={{ fontFamily: mono, fontSize: '0.85rem', lineHeight: 1.65, color: 'var(--text-faint)', margin: '0 0 1rem 0' }}>{EVAL_NOTE}</p>
            {EVAL_QUESTIONS[0]?.question === '(placeholder)' ? <Muted>questions added during phase 1</Muted> : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {EVAL_QUESTIONS.map((q, i) => (
                  <li key={i} style={{ fontFamily: mono, fontSize: '0.88rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--text)', marginBottom: '0.2rem' }}>
                      <span style={{ color: 'var(--text-faint)', marginRight: '0.5rem', fontSize: '0.68rem' }}>{String(i + 1).padStart(2, '0')}</span>{q.question}
                    </div>
                    <div style={{ color: 'var(--text-faint)', fontSize: '0.75rem', paddingLeft: '1.5rem' }}>expected: {q.expected}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Rule />

          <section>
            <Label>concepts learned</Label>
            {CONCEPTS.map(c => (
              <div key={c.term} style={{ padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: mono, fontSize: '0.85rem', fontWeight: 700, color: EVE_COLOR, display: 'block', marginBottom: '0.2rem' }}>{c.term}</span>
                <span style={{ fontFamily: mono, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{c.plain}</span>
              </div>
            ))}
          </section>
        </div>

      </div>
    </div>
  )
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ fontFamily: mono, fontSize: '0.78rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
      <span style={{ color: 'var(--text-faint)' }}>{label}:</span>
      <span style={{ color: EVE_COLOR, fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: mono, fontSize: '0.82rem', color: 'var(--text-faint)', margin: 0 }}>{children}</p>
}

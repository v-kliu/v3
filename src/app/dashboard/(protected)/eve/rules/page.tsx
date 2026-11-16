'use client'

import { useState, useEffect } from 'react'
import { RULE_SECTIONS, type RuleSection } from '@/eve/eveData'
import { PALETTE } from '@/components/grit/store'
import EveTabs from '@/components/dashboard/EveTabs'
import EveBg from '@/components/dashboard/EveBg'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'
const EVE_COLOR = PALETTE[5]
const STORAGE_KEY = 'eve-rules-v1'

function loadSections(): RuleSection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as RuleSection[]
  } catch { /* ignore */ }
  return RULE_SECTIONS.map(s => ({ ...s, rules: [...s.rules] }))
}

function saveSections(sections: RuleSection[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sections)) } catch { /* ignore */ }
}

export default function EveRulesPage() {
  const [sections, setSections] = useState<RuleSection[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { setSections(loadSections()); setLoaded(true) }, [])

  function addRule(sectionId: string) {
    const text = (drafts[sectionId] ?? '').trim()
    if (!text) return
    setSections(prev => {
      const next = prev.map(s => s.id === sectionId ? { ...s, rules: [...s.rules, text] } : s)
      saveSections(next)
      return next
    })
    setDrafts(d => ({ ...d, [sectionId]: '' }))
  }

  function deleteRule(sectionId: string, index: number) {
    setSections(prev => {
      const next = prev.map(s => s.id === sectionId ? { ...s, rules: s.rules.filter((_, i) => i !== index) } : s)
      saveSections(next)
      return next
    })
  }

  function resetToDefaults() {
    const seed = RULE_SECTIONS.map(s => ({ ...s, rules: [...s.rules] }))
    saveSections(seed)
    setSections(seed)
  }

  if (!loaded) return null

  return (
    <div style={{ width: '100%', paddingBottom: '4rem', color: 'var(--text)', position: 'relative', zIndex: 1 }}>
      <EveBg />

      <header style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontFamily: mono, fontSize: '0.72rem', color: 'var(--text-faint)', margin: '0 0 0.6rem 0', letterSpacing: '0.08em' }}>
          {'>'} eve --mode rules --editable true
        </p>
        <h1 style={{ fontFamily: mono, fontSize: '2.2rem', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 0.3rem 0', color: EVE_COLOR }}>rules</h1>
        <p style={{ fontFamily: mono, fontSize: '0.75rem', color: 'var(--text-faint)', margin: 0, letterSpacing: '0.06em' }}>
          explicit workflows and conventions / edits save to your browser
        </p>
      </header>

      <EveTabs />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
        {sections.map(section => (
          <section key={section.id}>
            <p style={{ fontFamily: mono, fontSize: '0.78rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: EVE_COLOR, margin: '0 0 0.9rem 0', opacity: 0.75 }}>
              {`// ${section.title}`}
            </p>
            <ol style={{ margin: '0 0 0.9rem 0', padding: 0, listStyle: 'none' }}>
              {section.rules.map((rule, i) => (
                <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', padding: '0.55rem 0', borderBottom: '1px solid var(--border)', fontFamily: mono, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  <span style={{ color: EVE_COLOR, opacity: 0.5, flexShrink: 0, fontSize: '0.68rem', minWidth: '1.6rem' }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ flex: 1 }}>{rule}</span>
                  <button onClick={() => deleteRule(section.id, i)} title="Remove" aria-label="remove rule"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontFamily: mono, fontSize: '1rem', padding: '0 0.2rem', flexShrink: 0, lineHeight: 1 }}>
                    ×
                  </button>
                </li>
              ))}
            </ol>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={drafts[section.id] ?? ''}
                onChange={e => setDrafts(d => ({ ...d, [section.id]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') addRule(section.id) }}
                placeholder="add a rule..."
                style={{ flex: 1, fontFamily: mono, fontSize: '0.85rem', background: 'rgba(139,92,246,0.06)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.45rem 0.7rem', color: 'var(--text)', outline: 'none' }}
              />
              <button onClick={() => addRule(section.id)}
                style={{ fontFamily: mono, fontSize: '0.8rem', background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '4px', padding: '0.45rem 0.9rem', color: EVE_COLOR, cursor: 'pointer' }}>
                + add
              </button>
            </div>
          </section>
        ))}
      </div>

      <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <button onClick={resetToDefaults}
          style={{ fontFamily: mono, fontSize: '0.75rem', background: 'none', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.4rem 0.9rem', color: 'var(--text-faint)', cursor: 'pointer' }}>
          reset to defaults
        </button>
        <span style={{ fontFamily: mono, fontSize: '0.7rem', color: 'var(--text-faint)', marginLeft: '0.75rem' }}>
          edits save in this browser only — to make them permanent, update eveData.ts
        </span>
      </div>
    </div>
  )
}

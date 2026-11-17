'use client'

import { useState, useEffect, useRef } from 'react'
import { RULE_SECTIONS, type RuleSection } from '@/eve/eveData'
import { PALETTE } from '@/components/grit/store'
import EveTabs from '@/components/dashboard/EveTabs'
import EveBg from '@/components/dashboard/EveBg'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'
const EVE_COLOR = PALETTE[5]

export default function EveRulesPage() {
  const [sections, setSections] = useState<RuleSection[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const dragSrc = useRef<{ sectionId: string; index: number } | null>(null)
  const [dragOver, setDragOver] = useState<{ sectionId: string; index: number } | null>(null)

  useEffect(() => {
    fetch('/api/eve/rules')
      .then(r => r.json())
      .then((data: RuleSection[]) => { setSections(data); setLoaded(true) })
      .catch(() => { setSections(RULE_SECTIONS.map(s => ({ ...s, rules: [...s.rules] }))); setLoaded(true) })
  }, [])

  async function persist(next: RuleSection[]) {
    setSections(next)
    setSaving(true)
    await fetch('/api/eve/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    }).finally(() => setSaving(false))
  }

  function addRule(sectionId: string) {
    const text = (drafts[sectionId] ?? '').trim()
    if (!text) return
    persist(sections.map(s => s.id === sectionId ? { ...s, rules: [...s.rules, text] } : s))
    setDrafts(d => ({ ...d, [sectionId]: '' }))
  }

  function deleteRule(sectionId: string, index: number) {
    persist(sections.map(s => s.id === sectionId ? { ...s, rules: s.rules.filter((_, i) => i !== index) } : s))
  }

  function onDragStart(sectionId: string, index: number) {
    dragSrc.current = { sectionId, index }
  }

  function onDragOver(e: React.DragEvent, sectionId: string, index: number) {
    e.preventDefault()
    setDragOver({ sectionId, index })
  }

  function onDrop(e: React.DragEvent, destSectionId: string, destIndex: number) {
    e.preventDefault()
    setDragOver(null)
    const src = dragSrc.current
    if (!src) return
    if (src.sectionId === destSectionId && src.index === destIndex) return

    const next = sections.map(s => ({ ...s, rules: [...s.rules] }))
    const srcSection = next.find(s => s.id === src.sectionId)
    const destSection = next.find(s => s.id === destSectionId)
    if (!srcSection || !destSection) return

    const [moved] = srcSection.rules.splice(src.index, 1)
    destSection.rules.splice(destIndex, 0, moved)
    dragSrc.current = null
    persist(next)
  }

  function onDragEnd() {
    dragSrc.current = null
    setDragOver(null)
  }

  function resetToDefaults() {
    persist(RULE_SECTIONS.map(s => ({ ...s, rules: [...s.rules] })))
  }

  if (!loaded) return (
    <div style={{ fontFamily: mono, fontSize: '0.8rem', color: 'var(--text-faint)', padding: '2rem' }}>
      loading rules...
    </div>
  )

  return (
    <div style={{ width: '100%', paddingBottom: '4rem', color: 'var(--text)', position: 'relative', zIndex: 1 }}>
      <EveBg />

      <header style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontFamily: mono, fontSize: '0.72rem', color: 'var(--text-faint)', margin: '0 0 0.6rem 0', letterSpacing: '0.08em' }}>
          {'>'} eve --mode rules --editable true
        </p>
        <h1 style={{ fontFamily: mono, fontSize: '2.2rem', fontWeight: 700, letterSpacing: '0.08em', margin: '0 0 0.3rem 0', color: EVE_COLOR }}>rules</h1>
        <p style={{ fontFamily: mono, fontSize: '0.75rem', color: 'var(--text-faint)', margin: 0, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          explicit workflows and conventions / drag to reorder / synced to database
          {saving && <span style={{ color: EVE_COLOR, opacity: 0.7 }}>saving...</span>}
        </p>
      </header>

      <EveTabs />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
        {sections.map(section => (
          <section key={section.id}>

            <div style={{
              borderBottom: `2px solid ${EVE_COLOR}`,
              paddingBottom: '0.5rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.5rem',
            }}>
              <span style={{ fontFamily: mono, fontSize: '0.65rem', color: EVE_COLOR, opacity: 0.6 }}>//</span>
              <span style={{ fontFamily: mono, fontSize: '1.05rem', fontWeight: 700, color: EVE_COLOR, letterSpacing: '0.04em' }}>
                {section.title}
              </span>
              <span style={{ fontFamily: mono, fontSize: '0.65rem', color: 'var(--text-faint)', marginLeft: 'auto' }}>
                {section.rules.length} rule{section.rules.length !== 1 ? 's' : ''}
              </span>
            </div>

            <ol style={{ margin: '0 0 0.9rem 0', padding: 0, listStyle: 'none' }}>
              {section.rules.map((rule, i) => {
                const isOver = dragOver?.sectionId === section.id && dragOver?.index === i
                return (
                  <li
                    key={i}
                    draggable
                    onDragStart={() => onDragStart(section.id, i)}
                    onDragOver={e => onDragOver(e, section.id, i)}
                    onDrop={e => onDrop(e, section.id, i)}
                    onDragEnd={onDragEnd}
                    style={{
                      display: 'flex', gap: '0.75rem', alignItems: 'baseline',
                      padding: '0.6rem 0',
                      borderBottom: isOver ? `2px solid ${EVE_COLOR}` : '1px solid var(--border)',
                      fontFamily: mono, fontSize: '0.9rem',
                      color: 'var(--text-muted)', lineHeight: 1.55,
                      cursor: 'grab', userSelect: 'none',
                    }}
                  >
                    <span style={{ color: 'var(--text-faint)', flexShrink: 0, fontSize: '0.65rem', opacity: 0.5 }}>⠿</span>
                    <span style={{ color: EVE_COLOR, opacity: 0.6, flexShrink: 0, fontSize: '0.68rem', minWidth: '1.6rem' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{ flex: 1 }}>{rule}</span>
                    <button
                      onClick={() => deleteRule(section.id, i)}
                      title="Remove"
                      aria-label="remove rule"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontFamily: mono, fontSize: '1rem', padding: '0 0.2rem', flexShrink: 0, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </li>
                )
              })}

              <li
                onDragOver={e => onDragOver(e, section.id, section.rules.length)}
                onDrop={e => onDrop(e, section.id, section.rules.length)}
                style={{
                  height: dragOver?.sectionId === section.id && dragOver?.index === section.rules.length ? '2px' : '0',
                  background: EVE_COLOR,
                  transition: 'height 0.1s',
                  listStyle: 'none',
                }}
              />
            </ol>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={drafts[section.id] ?? ''}
                onChange={e => setDrafts(d => ({ ...d, [section.id]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') addRule(section.id) }}
                placeholder="add a rule..."
                style={{ flex: 1, fontFamily: mono, fontSize: '0.85rem', background: 'rgba(139,92,246,0.06)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.45rem 0.7rem', color: 'var(--text)', outline: 'none' }}
              />
              <button
                onClick={() => addRule(section.id)}
                style={{ fontFamily: mono, fontSize: '0.8rem', background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '4px', padding: '0.45rem 0.9rem', color: EVE_COLOR, cursor: 'pointer' }}
              >
                + add
              </button>
            </div>
          </section>
        ))}
      </div>

      <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={resetToDefaults}
          style={{ fontFamily: mono, fontSize: '0.75rem', background: 'none', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.4rem 0.9rem', color: 'var(--text-faint)', cursor: 'pointer' }}
        >
          reset to defaults
        </button>
        <span style={{ fontFamily: mono, fontSize: '0.7rem', color: 'var(--text-faint)' }}>
          edits sync to database — changes persist across devices
        </span>
      </div>
    </div>
  )
}

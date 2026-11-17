'use client'

import { useState, useEffect, useRef } from 'react'
import { RULE_SECTIONS, type RuleSection } from '@/eve/eveData'
import EveHeader from '@/components/dashboard/EveHeader'
import EveBg from '@/components/dashboard/EveBg'

// Styles: eve.css (components) + dashboard.css [data-eve] (tokens).
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
  const dragSrc = useRef<{ sectionId: string; index: number } | null>(null)
  const [dragOver, setDragOver] = useState<{ sectionId: string; index: number } | null>(null)

  useEffect(() => { setSections(loadSections()); setLoaded(true) }, [])

  function update(next: RuleSection[]) {
    saveSections(next)
    setSections(next)
  }

  function addRule(sectionId: string) {
    const text = (drafts[sectionId] ?? '').trim()
    if (!text) return
    update(sections.map(s => s.id === sectionId ? { ...s, rules: [...s.rules, text] } : s))
    setDrafts(d => ({ ...d, [sectionId]: '' }))
  }

  function deleteRule(sectionId: string, index: number) {
    update(sections.map(s => s.id === sectionId ? { ...s, rules: s.rules.filter((_, i) => i !== index) } : s))
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
    update(next)
  }

  function onDragEnd() {
    dragSrc.current = null
    setDragOver(null)
  }

  function resetToDefaults() {
    update(RULE_SECTIONS.map(s => ({ ...s, rules: [...s.rules] })))
  }

  if (!loaded) return null

  return (
    <div className="eve">
      <EveBg />
      <EveHeader command="eve dev --mode rules --editable" />

      <p className="eve-lede" style={{ maxWidth: '82ch' }}>
        Explicit workflows and conventions every session follows. Drag to reorder. Edits save in this browser.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(380px, 100%), 1fr))', gap: '3.5rem 4rem', alignItems: 'start' }}>
        {sections.map(section => (
          <section key={section.id}>
            <div className="eve-entry-head" style={{ marginBottom: '0.5rem' }}>
              <h2 className="eve-h2" style={{ margin: 0 }}>{section.title}</h2>
              <span className="eve-faint eve-small eve-push">
                {section.rules.length} rule{section.rules.length !== 1 ? 's' : ''}
              </span>
            </div>

            <ol className="eve-rows" style={{ marginBottom: '1rem' }}>
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
                      cursor: 'grab', userSelect: 'none',
                      boxShadow: isOver ? 'inset 0 2px 0 var(--accent)' : undefined,
                    }}
                  >
                    <span className="eve-num" style={{ minWidth: '1.5rem' }}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="eve-muted" style={{ flex: 1 }}>{rule}</span>
                    <button
                      onClick={() => deleteRule(section.id, i)}
                      title="Remove"
                      aria-label="remove rule"
                      className="eve-icon-btn"
                    >
                      ×
                    </button>
                  </li>
                )
              })}

              {/* Drop zone at end of list */}
              <li
                onDragOver={e => onDragOver(e, section.id, section.rules.length)}
                onDrop={e => onDrop(e, section.id, section.rules.length)}
                style={{
                  padding: 0,
                  border: 'none',
                  height: dragOver?.sectionId === section.id && dragOver?.index === section.rules.length ? '2px' : '0.5rem',
                  background: dragOver?.sectionId === section.id && dragOver?.index === section.rules.length ? 'var(--accent)' : 'transparent',
                }}
              />
            </ol>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={drafts[section.id] ?? ''}
                onChange={e => setDrafts(d => ({ ...d, [section.id]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') addRule(section.id) }}
                placeholder="add a rule…"
                aria-label={`add a rule to ${section.title}`}
                className="eve-input"
                style={{ flex: 1 }}
              />
              <button onClick={() => addRule(section.id)} className="eve-btn">add</button>
            </div>
          </section>
        ))}
      </div>

      <hr className="eve-hr" />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={resetToDefaults} className="eve-btn eve-btn-quiet">reset to defaults</button>
        <span className="eve-faint eve-small">Edits stay in this browser. To make them permanent, update eveData.ts.</span>
      </div>
    </div>
  )
}

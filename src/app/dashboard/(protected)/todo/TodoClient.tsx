'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const mono = 'var(--mono)'

type Tab = { id: number; name: string; position: number }
type SaveStatus = 'saved' | 'saving'

// Whole-pixel font and line height so the ruled lines stay locked to the text on
// phones (fractional rem sizes round differently for text vs. backgrounds).
const FONT = 14
const LINE = 24

export type TodoInitial = Array<Tab & { content: string }>

// `initial` is fetched on the server by page.tsx, so the page arrives with its
// content instead of loading blank and fetching after hydration.
export default function TodoClient({ initial }: { initial: TodoInitial }) {
  const [tabs, setTabs] = useState<Tab[]>(() => initial.map(({ id, name, position }) => ({ id, name, position })))
  const [activeTabId, setActiveTabId] = useState<number | null>(initial[0]?.id ?? null)
  const [contents, setContents] = useState<Record<number, string>>(() =>
    Object.fromEntries(initial.map(t => [t.id, t.content ?? '']))
  )
  const [status, setStatus] = useState<SaveStatus>('saved')
  const [loaded, setLoaded] = useState(initial.length > 0)
  const [editingTabId, setEditingTabId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [stale, setStale] = useState(false)
  const [caret, setCaret] = useState({ ln: 1, col: 1, selLines: 0 })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)

  function loadAll(selectTabId?: number) {
    return fetch('/api/todo')
      .then(r => r.json())
      .then((data: Array<Tab & { content: string }>) => {
        if (!Array.isArray(data) || data.length === 0) { setLoaded(true); return }
        const tabList = data.map(({ id, name, position }) => ({ id, name, position }))
        const contentMap: Record<number, string> = {}
        data.forEach(t => { contentMap[t.id] = t.content ?? '' })
        setTabs(tabList)
        setContents(contentMap)
        setActiveTabId(selectTabId ?? tabList[0].id)
        setLoaded(true)
        setStale(false)
      })
      .catch(() => setLoaded(true))
  }

  useEffect(() => {
    // Only fetch here if the server couldn't hand us the data.
    if (initial.length === 0) loadAll()
    const bc = new BroadcastChannel('todo-sync')
    channelRef.current = bc
    bc.onmessage = () => setStale(true)
    return () => bc.close()
  }, [])

  const save = useCallback(async (tabId: number, value: string) => {
    try {
      await fetch('/api/todo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tabId, content: value }),
      })
      setStatus('saved')
      channelRef.current?.postMessage({ savedAt: Date.now() })
    } catch {
      setStatus('saved')
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (activeTabId === null) return
    const value = e.target.value
    setContents(prev => ({ ...prev, [activeTabId]: value }))
    setStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(activeTabId, value), 1000)
  }

  async function handleAddTab() {
    const res = await fetch('/api/todo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'new tab' }),
    })
    const newTab: Tab = await res.json()
    setTabs(prev => [...prev, newTab])
    setContents(prev => ({ ...prev, [newTab.id]: '' }))
    setActiveTabId(newTab.id)
    setEditingTabId(newTab.id)
    setEditingName('new tab')
  }

  async function handleDeleteTab(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (tabs.length <= 1) return
    await fetch(`/api/todo?id=${id}`, { method: 'DELETE' })
    const remaining = tabs.filter(t => t.id !== id)
    setTabs(remaining)
    setContents(prev => { const next = { ...prev }; delete next[id]; return next })
    if (activeTabId === id) setActiveTabId(remaining[0]?.id ?? null)
  }

  function handleTabClick(id: number) {
    if (id === activeTabId) {
      const tab = tabs.find(t => t.id === id)
      if (tab) { setEditingTabId(id); setEditingName(tab.name) }
    } else {
      setActiveTabId(id)
      setEditingTabId(null)
    }
  }

  async function handleNameCommit() {
    if (editingTabId === null) return
    const name = editingName.trim() || 'untitled'
    await fetch('/api/todo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingTabId, name }),
    })
    setTabs(prev => prev.map(t => t.id === editingTabId ? { ...t, name } : t))
    setEditingTabId(null)
  }

  const activeContent = activeTabId !== null ? (contents[activeTabId] ?? '') : ''
  const chars = activeContent.length
  const lineCount = activeContent ? activeContent.split(/\r?\n/).length : 0

  function updateCaret(e: React.SyntheticEvent<HTMLTextAreaElement>) {
    const t = e.currentTarget
    const before = t.value.slice(0, t.selectionStart)
    const ln = before.split('\n').length
    const selected = t.value.slice(t.selectionStart, t.selectionEnd)
    setCaret({ ln, col: before.length - before.lastIndexOf('\n'), selLines: selected ? selected.split('\n').length : 0 })
  }

  const btn: React.CSSProperties = { font: 'inherit', background: 'none', border: 0, padding: '0 6px', cursor: 'pointer', color: 'inherit' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1320, fontFamily: mono, fontSize: 13, color: '#111' }}>

      {/* Tabs */}
      {loaded && (
        <div role="tablist" style={{ display: 'flex', alignItems: 'flex-end', background: '#f4f4f4', border: '1px solid #d9d9d9', borderBottom: 0, overflowX: 'auto' }}>
          {tabs.map(tab => {
            const isActive = tab.id === activeTabId
            return (
              <div
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                tabIndex={0}
                onClick={() => handleTabClick(tab.id)}
                onKeyDown={e => { if (e.key === 'Enter' && editingTabId !== tab.id) handleTabClick(tab.id) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'default', userSelect: 'none',
                  padding: '5px 8px 5px 12px', borderRight: '1px solid #d9d9d9',
                  background: isActive ? '#fff' : 'transparent', color: isActive ? '#000' : '#444',
                }}
              >
                {editingTabId === tab.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={handleNameCommit}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); handleNameCommit() }
                      if (e.key === 'Escape') setEditingTabId(null)
                    }}
                    onClick={e => e.stopPropagation()}
                    style={{ font: 'inherit', border: '1px solid #888', background: '#fff', padding: 0, outline: 'none', width: `${Math.max(editingName.length, 4)}ch` }}
                  />
                ) : (
                  <span>{tab.name}</span>
                )}
                {tabs.length > 1 && (
                  <button onClick={e => handleDeleteTab(tab.id, e)} aria-label={`delete ${tab.name}`} style={{ ...btn, padding: '0 4px' }}>×</button>
                )}
              </div>
            )
          })}
          <button onClick={handleAddTab} aria-label="new tab" style={{ ...btn, padding: '5px 12px', fontSize: 16 }}>+</button>
        </div>
      )}

      {loaded && stale && (
        <button onClick={() => loadAll(activeTabId ?? undefined)} style={{ ...btn, textAlign: 'left', padding: '4px 8px', background: '#fff', border: '1px solid #d9d9d9', borderBottom: 0 }}>
          updated in another tab - click to reload
        </button>
      )}

      <textarea
        key={activeTabId ?? 'none'}
        value={activeContent}
        onChange={handleChange}
        onSelect={updateCaret}
        onKeyUp={updateCaret}
        onClick={updateCaret}
        placeholder=""
        spellCheck={false}
        className="todo-textarea"
        style={{
          width: '100%', flex: 1, resize: 'none', outline: 'none', borderRadius: 0,
          border: '1px solid #d9d9d9', background: '#fff', color: '#111',
          fontFamily: mono, fontSize: FONT, lineHeight: `${LINE}px`, padding: `${LINE / 2}px 10px`,
          WebkitTextSizeAdjust: '100%', textSizeAdjust: '100%', boxSizing: 'border-box',
          backgroundAttachment: 'local', backgroundOrigin: 'padding-box',
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE - 1}px, #f0f0f0 ${LINE - 1}px, #f0f0f0 ${LINE}px)`,
          backgroundPosition: `0 ${LINE / 2}px`,
        }}
      />

      <footer style={{ display: 'flex', gap: 24, padding: '3px 10px', background: '#f4f4f4', border: '1px solid #d9d9d9', borderTop: 0, fontSize: 12, color: '#222' }}>
        <span>Ln {caret.ln}, Col {caret.col}</span>
        <span>{caret.selLines > 0 ? `${caret.selLines} of ${lineCount}` : lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
        <span>{chars} characters</span>
        <span style={{ marginLeft: 'auto' }}>{status === 'saving' ? 'Saving...' : 'Saved'}</span>
      </footer>
    </div>
  )
}

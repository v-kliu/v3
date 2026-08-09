'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'

type Tab = { id: number; name: string; position: number }
type SaveStatus = 'saved' | 'saving'

export default function TodoPage() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<number | null>(null)
  const [contents, setContents] = useState<Record<number, string>>({})
  const [status, setStatus] = useState<SaveStatus>('saved')
  const [loaded, setLoaded] = useState(false)
  const [editingTabId, setEditingTabId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [stale, setStale] = useState(false)
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
    loadAll()
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

  return (
    <div style={{ width: '100%', maxWidth: '680px', display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Tab bar */}
      {loaded && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          borderBottom: '1px solid var(--border)',
          marginBottom: '1rem',
          overflowX: 'auto',
        }}>
          {tabs.map(tab => {
            const isActive = tab.id === activeTabId
            return (
              <div
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.35rem 0.55rem 0.35rem 0.65rem',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginBottom: '-1px',
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
                    style={{
                      fontFamily: mono,
                      fontSize: '0.75rem',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--accent)',
                      outline: 'none',
                      color: 'var(--text)',
                      width: `${Math.max(editingName.length, 4)}ch`,
                      padding: '0',
                    }}
                  />
                ) : (
                  <span style={{
                    fontFamily: mono,
                    fontSize: '0.75rem',
                    color: isActive ? 'var(--text)' : 'var(--text-faint)',
                    letterSpacing: '0.02em',
                    userSelect: 'none',
                  }}>
                    {tab.name}
                  </span>
                )}

                {tabs.length > 1 && (
                  <button
                    onClick={e => handleDeleteTab(tab.id, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-faint)',
                      fontFamily: mono,
                      fontSize: '0.75rem',
                      padding: '0 0 0 0.1rem',
                      lineHeight: 1,
                      opacity: isActive ? 0.6 : 0.25,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.opacity = '1' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.opacity = isActive ? '0.6' : '0.25' }}
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}

          <button
            onClick={handleAddTab}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-faint)',
              fontFamily: mono,
              fontSize: '0.9rem',
              padding: '0.25rem 0.6rem',
              lineHeight: 1,
              marginBottom: '2px',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)' }}
          >
            +
          </button>
        </div>
      )}

      {/* Save status / stale banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '0.5rem',
        minHeight: '1.2rem',
      }}>
        {loaded && (stale ? (
          <button
            onClick={() => loadAll(activeTabId ?? undefined)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: mono,
              fontSize: '0.68rem',
              color: 'var(--accent)',
              letterSpacing: '0.03em',
              padding: 0,
            }}
          >
            ↻ updated in another tab — click to sync
          </button>
        ) : (
          <span style={{
            fontFamily: mono,
            fontSize: '0.68rem',
            color: status === 'saving' ? 'var(--text-muted)' : 'var(--text-faint)',
            letterSpacing: '0.03em',
            transition: 'color 0.2s',
          }}>
            {status === 'saving' ? 'saving...' : 'saved'}
          </span>
        ))}
      </div>

      <textarea
        value={activeContent}
        onChange={handleChange}
        placeholder={loaded ? 'start typing...' : ''}
        spellCheck
        className="todo-textarea"
        style={{
          flex: 1,
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontFamily: mono,
          fontSize: '0.88rem',
          color: 'var(--text-muted)',
          lineHeight: 1.8,
          caretColor: 'var(--accent)',
          boxSizing: 'border-box',
          minHeight: 'calc(100vh - 120px)',
        }}
      />
    </div>
  )
}

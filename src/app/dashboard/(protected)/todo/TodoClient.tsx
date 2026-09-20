'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { Plus, RefreshCw, X } from 'lucide-react'
import { colorForId, inkOf, tint } from '@/components/dashboard/theme'
import { useTabTint } from '@/components/dashboard/useTabTint'
import { cn } from '@/lib/utils'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'

type Tab = { id: number; name: string; position: number }
type SaveStatus = 'saved' | 'saving'

// One ruled line of the textarea: 0.9rem font × 1.8 line-height. The paper lines
// in the background are drawn at this pitch so text sits on them.
const LINE = '1.62rem'

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
  const color = activeTabId !== null ? colorForId(activeTabId) : 'var(--text-faint)'
  useTabTint(activeTabId !== null ? color : null)
  const { lines, words } = useMemo(() => {
    const trimmed = activeContent.trim()
    return {
      lines: activeContent ? activeContent.split('\n').length : 0,
      words: trimmed ? trimmed.split(/\s+/).length : 0,
    }
  }, [activeContent])

  return (
    <div className="flex w-full max-w-[1320px] flex-col pb-10 text-[var(--text)]">

      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[1.85rem] font-medium leading-none tracking-[0.14em]">todo</h1>
          <div className="mt-2.5 flex items-center gap-1.5" aria-hidden>
            {tabs.map(t => (
              <span
                key={t.id}
                className={cn('h-1.5 rounded-full transition-[width,opacity] duration-300', t.id === activeTabId ? 'w-8' : 'w-4 opacity-50')}
                style={{ background: colorForId(t.id) }}
              />
            ))}
          </div>
        </div>
        {loaded && (
          <div className="flex gap-x-6 font-mono">
            <Stat label="lines" value={lines} color={color} />
            <Stat label="words" value={words} color={color} />
          </div>
        )}
      </header>

      {/* Tabs */}
      {loaded && (
        <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
          {tabs.map(tab => {
            const isActive = tab.id === activeTabId
            const c = colorForId(tab.id)
            return (
              <div
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                tabIndex={0}
                onClick={() => handleTabClick(tab.id)}
                onKeyDown={e => { if (e.key === 'Enter' && editingTabId !== tab.id) handleTabClick(tab.id) }}
                className={cn(
                  'group relative flex shrink-0 cursor-pointer select-none items-center gap-2 rounded-full py-1.5 pl-3.5 pr-2.5 font-mono text-[0.78rem] tracking-[0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text)]/20',
                  !isActive && 'text-[var(--text-muted)] hover:bg-[var(--bg-alt)]'
                )}
                style={isActive ? { color: inkOf(c) } : undefined}
              >
                {isActive && (
                  <m.span
                    layoutId="todo-tab"
                    className="absolute inset-0 rounded-full"
                    style={{ background: tint(c, 17), boxShadow: `inset 0 0 0 1px ${tint(c, 42)}` }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative h-2 w-2 shrink-0 rounded-full" style={{ background: c }} />

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
                    className="relative border-0 border-b bg-transparent p-0 text-inherit outline-none"
                    style={{ fontFamily: mono, borderColor: c, width: `${Math.max(editingName.length, 4)}ch` }}
                  />
                ) : (
                  <span className="relative">{tab.name}</span>
                )}

                {tabs.length > 1 && (
                  <button
                    onClick={e => handleDeleteTab(tab.id, e)}
                    aria-label={`delete ${tab.name}`}
                    className={cn(
                      'relative grid h-4 w-4 place-items-center rounded-full transition-[opacity,background-color,color] hover:bg-[var(--accent)]/15 hover:text-[var(--accent)]',
                      isActive ? 'opacity-60' : 'opacity-0 group-hover:opacity-50 [@media(hover:none)]:hidden'
                    )}
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            )
          })}

          <button
            onClick={handleAddTab}
            aria-label="new tab"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-dashed border-[var(--border)] text-[var(--text-faint)] transition-colors hover:border-[var(--tab)] hover:text-[var(--tab-ink)]"
          >
            <Plus size={13} />
          </button>
        </div>
      )}

      {/* Page */}
      <section
        className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_18px_40px_-28px_rgba(60,40,10,0.35)]"
      >
        <div className="h-[3px] w-full transition-colors duration-300" style={{ background: color }} />

        <AnimatePresence initial={false}>
          {loaded && stale && (
            <m.div
              key="stale"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <button
                onClick={() => loadAll(activeTabId ?? undefined)}
                className="flex w-full items-center gap-2 px-6 py-2 text-left font-mono text-[0.72rem] tracking-[0.03em]"
                style={{ background: tint(color, 14), color: inkOf(color) }}
              >
                <RefreshCw size={12} /> updated in another tab — click to sync
              </button>
            </m.div>
          )}
        </AnimatePresence>

        <textarea
          key={activeTabId ?? 'none'}
          value={activeContent}
          onChange={handleChange}
          placeholder={loaded ? 'start typing...' : ''}
          spellCheck
          className="todo-textarea w-full flex-1 resize-none border-0 bg-transparent outline-none placeholder:text-[var(--text-faint)]"
          style={{
            fontFamily: mono,
            fontSize: '0.9rem',
            lineHeight: 1.8,
            color: 'var(--text)',
            caretColor: color,
            padding: `${LINE} 2rem`,
            backgroundAttachment: 'local',
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent calc(${LINE} - 1px), ${tint(color, 16)} calc(${LINE} - 1px), ${tint(color, 16)} ${LINE})`,
          }}
        />

        <footer className="flex items-center justify-between gap-4 border-t border-[var(--border)] px-6 py-2.5 font-mono text-[0.66rem] text-[var(--text-faint)]">
          <span className="tabular-nums">{lines} {lines === 1 ? 'line' : 'lines'} · {words} {words === 1 ? 'word' : 'words'}</span>
          <span className="flex items-center gap-1.5" style={{ color: status === 'saving' ? 'var(--text-muted)' : undefined }}>
            <span
              className={cn('h-1.5 w-1.5 rounded-full transition-colors', status === 'saving' && 'animate-pulse')}
              style={{ background: status === 'saving' ? color : 'var(--border)' }}
            />
            {status === 'saving' ? 'saving...' : 'saved'}
          </span>
        </footer>
      </section>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-xl font-medium tabular-nums leading-none transition-colors duration-300" style={{ color }}>{value}</span>
      <span className="mt-1.5 text-[0.6rem] uppercase tracking-[0.12em] text-[var(--text-faint)]">{label}</span>
    </div>
  )
}

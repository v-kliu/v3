'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'

type SaveStatus = 'saved' | 'saving'

export default function TodoPage() {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<SaveStatus>('saved')
  const [loaded, setLoaded] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/todo')
      .then((r) => r.json())
      .then((json) => {
        setContent(json.content ?? '')
        setLoaded(true)
      })
      .catch(() => { setLoaded(true) })
  }, [])

  const save = useCallback(async (value: string) => {
    try {
      await fetch('/api/todo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: value }),
      })
      setStatus('saved')
    } catch {
      setStatus('saved')
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setContent(value)
    setStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { save(value) }, 1000)
  }

  return (
    <div style={{ width: '100%', maxWidth: '680px', display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* status indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '0.5rem',
        minHeight: '1.2rem',
      }}>
        {loaded && (
          <span style={{
            fontFamily: mono,
            fontSize: '0.68rem',
            color: status === 'saving' ? 'var(--text-muted)' : 'var(--text-faint)',
            letterSpacing: '0.03em',
            transition: 'color 0.2s',
          }}>
            {status === 'saving' ? 'saving...' : 'saved'}
          </span>
        )}
      </div>

      <textarea
        value={content}
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

'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/dashboard')
    } else {
      setError('wrong password')
      setPassword('')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          width: '100%',
          maxWidth: '280px',
        }}
      >
        <p style={{
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
          fontSize: '0.75rem',
          color: 'var(--text-faint)',
          margin: 0,
          letterSpacing: '0.04em',
        }}>
          jarvis access
        </p>

        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="password"
          autoFocus
          style={{
            background: 'var(--bg-alt)',
            border: '1px solid var(--border)',
            borderRadius: '3px',
            padding: '0.5rem 0.65rem',
            fontSize: '0.9rem',
            color: 'var(--text)',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />

        {error && (
          <p style={{
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
            fontSize: '0.72rem',
            color: 'var(--accent)',
            margin: 0,
          }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: '3px',
            padding: '0.45rem 0',
            fontSize: '0.8rem',
            color: loading ? 'var(--text-faint)' : 'var(--text)',
            cursor: loading ? 'default' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {loading ? '...' : 'enter'}
        </button>
      </form>
    </div>
  )
}

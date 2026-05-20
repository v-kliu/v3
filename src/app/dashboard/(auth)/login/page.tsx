'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const mono = 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace'

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
      flexDirection: 'column',
    }}>
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <Link href="/" style={{
          fontFamily: mono,
          fontSize: '0.72rem',
          color: 'var(--text-faint)',
          textDecoration: 'none',
          letterSpacing: '0.03em',
        }}>
          ← back
        </Link>
      </div>

      <div style={{
        flex: 1,
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
            maxWidth: '260px',
          }}
        >
          <div>
            <p style={{
              fontFamily: mono,
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text)',
              margin: '0 0 0.15rem 0',
              letterSpacing: '-0.01em',
            }}>
              Eve
            </p>
            <p style={{
              fontFamily: mono,
              fontSize: '0.7rem',
              color: 'var(--text-faint)',
              margin: 0,
              letterSpacing: '0.03em',
            }}>
              access password
            </p>
          </div>

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
              marginTop: '0.25rem',
            }}
          />

          {error && (
            <p style={{
              fontFamily: mono,
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
              color: loading || !password ? 'var(--text-faint)' : 'var(--text)',
              cursor: loading || !password ? 'default' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {loading ? '...' : 'enter'}
          </button>
        </form>
      </div>
    </div>
  )
}

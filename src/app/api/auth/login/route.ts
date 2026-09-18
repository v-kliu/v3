import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// in-memory rate limiter: ip → { count, resetAt }
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

export async function POST(request: Request) {
  const ip = getIp(request)
  const userAgent = request.headers.get('user-agent') ?? 'unknown'
  const now = Date.now()

  // check rate limit
  const record = loginAttempts.get(ip)
  if (record) {
    if (now >= record.resetAt) {
      loginAttempts.delete(ip)
    } else if (record.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again in 15 minutes.' },
        { status: 429 }
      )
    }
  }

  const { password } = await request.json() as { password?: string }

  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  const expected = process.env.ADMIN_PASSWORD!
  let match = false
  try {
    match =
      timingSafeEqual(
        Buffer.from(password.padEnd(expected.length)),
        Buffer.from(expected.padEnd(password.length))
      ) && password.length === expected.length
  } catch {
    match = false
  }

  if (!match) {
    const rec = loginAttempts.get(ip)
    if (rec && now < rec.resetAt) {
      loginAttempts.set(ip, { ...rec, count: rec.count + 1 })
    } else {
      loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    }
    supabase.from('vkliu_login_logs').insert({ ip, user_agent: userAgent, success: false })
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  loginAttempts.delete(ip)
  supabase.from('vkliu_login_logs').insert({ ip, user_agent: userAgent, success: true })

  const token = await signToken()
  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return response
}

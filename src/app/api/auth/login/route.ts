import { NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// Shared across serverless instances (an in-memory map resets per instance and is trivially bypassed)
const redis = Redis.fromEnv()
const MAX_ATTEMPTS = 5
const WINDOW_S = 15 * 60 // 15 minutes

function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

export async function POST(request: Request) {
  const ip = getIp(request)
  const userAgent = request.headers.get('user-agent') ?? 'unknown'
  const key = `login-fail:${ip}`

  const attempts = (await redis.get<number>(key)) ?? 0
  if (attempts >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => null) as { password?: unknown } | null
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!password || password.length > 256) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  // hash both sides so the comparison is fixed-length and constant-time
  const sha = (v: string) => createHash('sha256').update(v).digest()
  const match = timingSafeEqual(sha(password), sha(expected))

  if (!match) {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, WINDOW_S)
    await supabase.from('vkliu_login_logs').insert({ ip, user_agent: userAgent, success: false })
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  await redis.del(key)
  await supabase.from('vkliu_login_logs').insert({ ip, user_agent: userAgent, success: true })

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

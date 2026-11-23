import { NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const userAgent = request.headers.get('user-agent') ?? 'unknown'

  const body = await request.json().catch(() => null) as { password?: unknown } | null
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!password || password.length > 256) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  const sha = (v: string) => createHash('sha256').update(v).digest()
  const match = timingSafeEqual(sha(password), sha(expected))

  if (!match) {
    await supabase.from('vkliu_login_logs').insert({ ip, user_agent: userAgent, success: false })
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

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

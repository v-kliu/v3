import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'

export async function POST(request: Request) {
  const { password } = await request.json() as { password?: string }

  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  const expected = process.env.ADMIN_PASSWORD!
  let match = false
  try {
    match = timingSafeEqual(
      Buffer.from(password.padEnd(expected.length)),
      Buffer.from(expected.padEnd(password.length))
    ) && password.length === expected.length
  } catch {
    match = false
  }

  if (!match) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

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

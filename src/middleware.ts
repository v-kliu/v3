import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

// API routes that are intentionally reachable without a session.
const PUBLIC_API = new Set(['/api/auth/login', '/api/auth/logout', '/api/visit', '/api/locations'])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/dashboard/login' || PUBLIC_API.has(pathname)) return NextResponse.next()

  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token || !(await verifyToken(token))) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/dashboard/login', request.url))
  }

  return NextResponse.next()
}

// Fail closed: every /api route needs a session unless listed in PUBLIC_API above.
export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}

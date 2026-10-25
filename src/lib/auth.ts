import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'eve-session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

// Fail closed: a missing/short secret would otherwise sign tokens with a guessable key.
function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) throw new Error('JWT_SECRET must be set to at least 32 characters')
  return new TextEncoder().encode(s)
}

export async function signToken(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
    return true
  } catch {
    return false
  }
}

export { COOKIE_NAME, COOKIE_MAX_AGE }

import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE_NAME = 'jarvis-session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function signToken(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export { COOKIE_NAME, COOKIE_MAX_AGE }

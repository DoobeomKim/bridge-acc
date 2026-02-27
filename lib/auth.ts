import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'auth-token'
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

export type SessionDuration = '24h' | '7d' | '30d-sliding'

interface TokenPayload {
  sessionType: SessionDuration
  iat?: number
  exp?: number
}

function durationToSeconds(duration: SessionDuration): number {
  switch (duration) {
    case '24h': return 60 * 60 * 24
    case '7d': return 60 * 60 * 24 * 7
    case '30d-sliding': return 60 * 60 * 24 * 30
  }
}

export async function signToken(sessionType: SessionDuration): Promise<string> {
  const expiresIn = durationToSeconds(sessionType)
  return new SignJWT({ sessionType })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

export function setAuthCookie(response: NextResponse, token: string, sessionType: SessionDuration) {
  const maxAge = durationToSeconds(sessionType)
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export function getTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(COOKIE_NAME)?.value
}

/** Server Component용 - 현재 인증 상태 확인 */
export async function getAuthFromCookies(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

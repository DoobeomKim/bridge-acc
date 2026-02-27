import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, signToken, setAuthCookie, getTokenFromRequest, SessionDuration } from '@/lib/auth'

// 인증 없이 접근 가능한 경로
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 공개 경로는 통과
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // 정적 파일, Next.js 내부 경로 통과
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/fonts') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = getTokenFromRequest(request)

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await verifyToken(token)

  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const response = NextResponse.next()

  // Sliding session: 30d-sliding이면 매 요청마다 쿠키 갱신
  if (payload.sessionType === '30d-sliding') {
    const newToken = await signToken('30d-sliding')
    setAuthCookie(response, newToken, '30d-sliding')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 요청에 미들웨어 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signToken, setAuthCookie, SessionDuration } from '@/lib/auth'

// bcryptjs는 Edge runtime에서 동작하지 않으므로 Node.js runtime 사용
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: '패스워드를 입력해주세요.' }, { status: 400 })
    }

    const passwordHashB64 = process.env.ADMIN_PASSWORD_HASH
    if (!passwordHashB64) {
      console.error('ADMIN_PASSWORD_HASH 환경변수가 설정되지 않았습니다.')
      return NextResponse.json({ error: '서버 설정 오류입니다.' }, { status: 500 })
    }

    // base64 디코딩 (dotenv-expand의 $ 변수 확장 문제 우회)
    const passwordHash = Buffer.from(passwordHashB64, 'base64').toString('utf8')

    const isValid = await bcrypt.compare(password, passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: '패스워드가 올바르지 않습니다.' }, { status: 401 })
    }

    // DB에서 세션 설정 읽기
    const settings = await prisma.settings.findFirst()
    const sessionDuration = (settings?.sessionDuration || '7d') as SessionDuration

    const token = await signToken(sessionDuration)

    const response = NextResponse.json({ success: true })
    setAuthCookie(response, token, sessionDuration)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '로그인 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

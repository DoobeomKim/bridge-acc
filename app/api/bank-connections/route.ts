import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/bank-connections
 * 은행 연결 목록 조회
 */
export async function GET() {
  try {
    const connections = await prisma.bankConnection.findMany({
      include: {
        bankAccount: {
          select: {
            id: true,
            bankName: true,
            accountName: true,
            iban: true,
            balance: true,
            currency: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: connections,
    })
  } catch (error) {
    console.error('Error fetching bank connections:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch bank connections',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bank-connections
 * 새 은행 연결 생성 (OAuth 콜백 후 호출)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      bankName,
      connectionType,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      externalAccountId,
      bankAccountId,
    } = body

    // bankAccountId가 없으면 새 계좌 생성
    let accountId = bankAccountId

    if (!accountId) {
      const account = await prisma.bankAccount.create({
        data: {
          bankName: bankName || 'Vivid Money',
          accountName: 'Connected Account',
        },
      })
      accountId = account.id
    }

    // 연결 생성
    const connection = await prisma.bankConnection.create({
      data: {
        bankName: bankName || 'Vivid Money',
        connectionType: connectionType || 'api',
        accessToken: accessToken || null,
        refreshToken: refreshToken || null,
        tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : null,
        externalAccountId: externalAccountId || null,
        bankAccountId: accountId,
      },
      include: {
        bankAccount: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: connection,
    })
  } catch (error) {
    console.error('Error creating bank connection:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create bank connection',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

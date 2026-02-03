import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/bank-connections/disconnect
 * Disconnect a bank connection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectionId } = body

    if (!connectionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'connectionId is required',
        },
        { status: 400 }
      )
    }

    // Get bank connection
    const connection = await prisma.bankConnection.findUnique({
      where: { id: connectionId },
    })

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bank connection not found',
        },
        { status: 404 }
      )
    }

    // Update connection status to disconnected
    // Note: We keep the connection record for historical purposes
    // but mark it as disconnected and clear sensitive data
    await prisma.bankConnection.update({
      where: { id: connectionId },
      data: {
        status: 'disconnected',
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        lastSyncStatus: null,
        lastSyncError: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: '은행 연결이 해제되었습니다',
    })
  } catch (error) {
    console.error('Error disconnecting bank:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to disconnect bank connection',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

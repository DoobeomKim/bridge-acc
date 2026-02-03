import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * DELETE /api/transactions/deduplicate
 * 중복된 거래내역 삭제 (날짜, 금액, 설명, 상대방이 동일한 경우)
 */
export async function DELETE() {
  try {
    // 모든 거래 가져오기
    const allTransactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'asc' }, // 가장 먼저 생성된 것을 유지
    })

    // 중복 체크용 맵 (날짜, 금액, 설명, 상대방 조합)
    const seen = new Map<string, string>() // key: 고유키, value: 거래ID
    const duplicateIds: string[] = []

    for (const transaction of allTransactions) {
      // 날짜를 YYYY-MM-DD 형식으로 정규화
      const normalizedDate = new Date(transaction.date).toISOString().split('T')[0]

      // 고유 키 생성
      const uniqueKey = `${normalizedDate}|${transaction.amount}|${transaction.description}|${transaction.counterparty || ''}`

      if (seen.has(uniqueKey)) {
        // 중복 발견
        duplicateIds.push(transaction.id)
      } else {
        // 최초 발견
        seen.set(uniqueKey, transaction.id)
      }
    }

    // 중복 거래 삭제
    const deleteResult = await prisma.transaction.deleteMany({
      where: {
        id: { in: duplicateIds },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        total: allTransactions.length,
        duplicates: duplicateIds.length,
        remaining: allTransactions.length - duplicateIds.length,
        deleted: deleteResult.count,
      },
    })
  } catch (error) {
    console.error('Error deduplicating transactions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to deduplicate transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

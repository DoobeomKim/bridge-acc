import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * DELETE /api/transactions/:id
 * 특정 거래내역 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 거래 존재 확인
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    })

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found',
        },
        { status: 404 }
      )
    }

    // 거래 삭제
    await prisma.transaction.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      data: { id },
    })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/transactions/:id
 * 특정 거래내역 수정
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // 거래 존재 확인
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    })

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found',
        },
        { status: 404 }
      )
    }

    // VAT 금액 계산
    let vatAmount = null
    if (body.vatRate !== null && body.vatRate !== undefined) {
      const amount = transaction.amount
      if (amount < 0) {
        // 지출: 총액에 VAT 포함되어 있음
        const netAmount = amount / (1 + body.vatRate / 100)
        vatAmount = amount - netAmount
      } else {
        // 수입: amount가 순액
        vatAmount = (amount * body.vatRate) / 100
      }
      vatAmount = Math.round(vatAmount * 100) / 100
    }

    // 거래 수정
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        description: body.description || '',
        category: body.category,
        vatRate: body.vatRate,
        vatAmount,
        notes: body.notes,
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

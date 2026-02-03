import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/transactions
 * 거래내역 목록 조회 (필터링, 정렬, 페이지네이션)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // 필터 파라미터
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const type = searchParams.get('type') // 'income' | 'expense'

    // 정렬 파라미터
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // 페이지네이션
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Where 조건 구성
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (category) {
      where.category = category
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { counterparty: { contains: search } },
        { notes: { contains: search } },
      ]
    }

    if (type === 'income') {
      where.amount = { gt: 0 }
    } else if (type === 'expense') {
      where.amount = { lt: 0 }
    }

    // 거래내역 조회
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
        include: {
          bankAccount: {
            select: {
              accountName: true,
              bankName: true,
            },
          },
          attachments: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transactions',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transactions
 * 새 거래내역 생성 (수동 추가)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      bankAccountId,
      date,
      amount,
      currency = 'EUR',
      description,
      counterparty,
      category,
      subCategory,
      vatRate,
      notes,
      tags,
    } = body

    // 필수 필드 검증
    if (!bankAccountId || !date || amount === undefined || !description) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: bankAccountId, date, amount, description',
        },
        { status: 400 }
      )
    }

    // VAT 금액 계산
    let vatAmount = null
    if (vatRate !== null && vatRate !== undefined) {
      // 지출의 경우: 총액에서 VAT 분리
      // 수입의 경우: 순액에서 VAT 계산
      if (amount < 0) {
        // 지출: 총액에 VAT 포함되어 있음
        const netAmount = amount / (1 + vatRate / 100)
        vatAmount = amount - netAmount
      } else {
        // 수입: amount가 순액
        vatAmount = (amount * vatRate) / 100
      }
      vatAmount = Math.round(vatAmount * 100) / 100
    }

    // 거래내역 생성
    const transaction = await prisma.transaction.create({
      data: {
        bankAccountId,
        source: 'manual',
        date: new Date(date),
        amount: parseFloat(amount),
        currency,
        description,
        counterparty: counterparty || null,
        category: category || null,
        subCategory: subCategory || null,
        vatRate: vatRate !== null ? parseFloat(vatRate) : null,
        vatAmount,
        notes: notes || null,
        tags: tags || null,
      },
      include: {
        bankAccount: {
          select: {
            accountName: true,
            bankName: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: transaction,
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create transaction',
      },
      { status: 500 }
    )
  }
}

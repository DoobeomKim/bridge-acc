import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfMonth, endOfMonth } from 'date-fns'

/**
 * GET /api/dashboard
 * Dashboard 통계 조회
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month') // YYYY-MM format

    // 현재 월 또는 지정된 월
    const targetDate = month ? new Date(month) : new Date()
    const startDate = startOfMonth(targetDate)
    const endDate = endOfMonth(targetDate)

    // 이번 달 거래내역 조회
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        category: true,
        vatRate: true,
        vatAmount: true,
      },
    })

    // 수입/지출 계산
    let totalIncome = 0
    let totalExpense = 0
    let vatPayable = 0 // 납부 예정 VAT

    const categoryBreakdown: Record<string, { amount: number; count: number }> = {}
    const vatByRate: Record<number, { net: number; vat: number }> = {}

    transactions.forEach((t) => {
      if (t.amount > 0) {
        totalIncome += t.amount
      } else {
        totalExpense += Math.abs(t.amount)
      }

      // 카테고리별 집계
      if (t.category) {
        if (!categoryBreakdown[t.category]) {
          categoryBreakdown[t.category] = { amount: 0, count: 0 }
        }
        categoryBreakdown[t.category].amount += Math.abs(t.amount)
        categoryBreakdown[t.category].count += 1
      }

      // VAT 집계
      if (t.vatRate !== null && t.vatAmount !== null) {
        if (!vatByRate[t.vatRate]) {
          vatByRate[t.vatRate] = { net: 0, vat: 0 }
        }

        // 수입의 경우 VAT 받음 (양수)
        // 지출의 경우 VAT 냄 (음수)
        if (t.amount > 0) {
          vatByRate[t.vatRate].vat += t.vatAmount
          vatByRate[t.vatRate].net += t.amount
        } else {
          vatByRate[t.vatRate].vat += t.vatAmount // 이미 음수
          vatByRate[t.vatRate].net += t.amount // 이미 음수
        }
      }
    })

    // VAT 납부 예정액 = 받은 VAT - 낸 VAT
    Object.values(vatByRate).forEach((v) => {
      vatPayable += v.vat
    })

    // 카테고리별 정렬 (금액 높은 순)
    const sortedCategories = Object.entries(categoryBreakdown)
      .map(([category, data]) => ({
        category,
        ...data,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10) // Top 10

    // 최근 거래내역
    const recentTransactions = await prisma.transaction.findMany({
      orderBy: {
        date: 'desc',
      },
      take: 10,
      select: {
        id: true,
        date: true,
        amount: true,
        currency: true,
        description: true,
        counterparty: true,
        category: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalIncome: Math.round(totalIncome * 100) / 100,
          totalExpense: Math.round(totalExpense * 100) / 100,
          netIncome: Math.round((totalIncome - totalExpense) * 100) / 100,
          vatPayable: Math.round(vatPayable * 100) / 100,
        },
        categoryBreakdown: sortedCategories,
        vatByRate: Object.entries(vatByRate).map(([rate, data]) => ({
          rate: parseFloat(rate),
          netAmount: Math.round(data.net * 100) / 100,
          vatAmount: Math.round(data.vat * 100) / 100,
        })),
        recentTransactions,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard data',
      },
      { status: 500 }
    )
  }
}

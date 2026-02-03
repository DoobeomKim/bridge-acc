import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateExcelReport, generateCsvReport } from '@/lib/report-generator'

/**
 * GET /api/reports
 * 리포트 생성 및 다운로드
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format_type = searchParams.get('format') || 'excel' // 'excel' or 'csv'

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Start date and end date are required',
        },
        { status: 400 }
      )
    }

    // 거래내역 조회
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    if (transactions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No transactions found for the selected period',
        },
        { status: 404 }
      )
    }

    // 요약 계산
    let totalIncome = 0
    let totalExpense = 0
    const categoryBreakdown: Record<string, { amount: number; count: number }> = {}
    const vatByRate: Record<number, { net: number; vat: number; gross: number }> = {}

    transactions.forEach((tx) => {
      if (tx.amount > 0) {
        totalIncome += tx.amount
      } else {
        totalExpense += Math.abs(tx.amount)
      }

      // 카테고리별 집계
      if (tx.category) {
        if (!categoryBreakdown[tx.category]) {
          categoryBreakdown[tx.category] = { amount: 0, count: 0 }
        }
        categoryBreakdown[tx.category].amount += Math.abs(tx.amount)
        categoryBreakdown[tx.category].count += 1
      }

      // VAT 집계
      if (tx.vatRate !== null && tx.vatAmount !== null) {
        if (!vatByRate[tx.vatRate]) {
          vatByRate[tx.vatRate] = { net: 0, vat: 0, gross: 0 }
        }

        if (tx.amount > 0) {
          // 수입
          vatByRate[tx.vatRate].net += tx.amount
          vatByRate[tx.vatRate].vat += tx.vatAmount
          vatByRate[tx.vatRate].gross += tx.amount + tx.vatAmount
        } else {
          // 지출 (음수)
          vatByRate[tx.vatRate].net += tx.amount
          vatByRate[tx.vatRate].vat += tx.vatAmount
          vatByRate[tx.vatRate].gross += tx.amount + tx.vatAmount
        }
      }
    })

    const summary = {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netAmount: Math.round((totalIncome - totalExpense) * 100) / 100,
      vatSummary: Object.entries(vatByRate)
        .map(([rate, data]) => ({
          rate: parseFloat(rate),
          netAmount: Math.round(data.net * 100) / 100,
          vatAmount: Math.round(data.vat * 100) / 100,
          grossAmount: Math.round(data.gross * 100) / 100,
        }))
        .sort((a, b) => a.rate - b.rate),
      categoryBreakdown: Object.entries(categoryBreakdown)
        .map(([category, data]) => ({
          category,
          amount: Math.round(data.amount * 100) / 100,
          count: data.count,
        }))
        .sort((a, b) => b.amount - a.amount),
    }

    // 파일 생성
    if (format_type === 'csv') {
      const csvContent = generateCsvReport(transactions)
      const filename = `회계자료_${startDate}_${endDate}.csv`

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      })
    } else {
      // Excel
      const buffer = await generateExcelReport(transactions, summary, {
        startDate,
        endDate,
      })
      const filename = `회계자료_${startDate}_${endDate}.xlsx`

      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          'Content-Length': buffer.length.toString(),
        },
      })
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reports/preview
 * 리포트 미리보기 (다운로드 없이 데이터만 반환)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { startDate, endDate } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Start date and end date are required',
        },
        { status: 400 }
      )
    }

    // 거래내역 조회
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // 요약 계산
    let totalIncome = 0
    let totalExpense = 0
    const categoryBreakdown: Record<string, { amount: number; count: number }> = {}
    const vatByRate: Record<number, { net: number; vat: number }> = {}

    transactions.forEach((tx) => {
      if (tx.amount > 0) {
        totalIncome += tx.amount
      } else {
        totalExpense += Math.abs(tx.amount)
      }

      if (tx.category) {
        if (!categoryBreakdown[tx.category]) {
          categoryBreakdown[tx.category] = { amount: 0, count: 0 }
        }
        categoryBreakdown[tx.category].amount += Math.abs(tx.amount)
        categoryBreakdown[tx.category].count += 1
      }

      if (tx.vatRate !== null && tx.vatAmount !== null) {
        if (!vatByRate[tx.vatRate]) {
          vatByRate[tx.vatRate] = { net: 0, vat: 0 }
        }
        vatByRate[tx.vatRate].vat += tx.vatAmount
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        transactionCount: transactions.length,
        summary: {
          totalIncome: Math.round(totalIncome * 100) / 100,
          totalExpense: Math.round(totalExpense * 100) / 100,
          netAmount: Math.round((totalIncome - totalExpense) * 100) / 100,
        },
        categoryBreakdown: Object.entries(categoryBreakdown).map(
          ([category, data]) => ({
            category,
            amount: Math.round(data.amount * 100) / 100,
            count: data.count,
          })
        ),
        vatSummary: Object.entries(vatByRate).map(([rate, data]) => ({
          rate: parseFloat(rate),
          vatAmount: Math.round(data.vat * 100) / 100,
        })),
      },
    })
  } catch (error) {
    console.error('Error generating report preview:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate report preview',
      },
      { status: 500 }
    )
  }
}

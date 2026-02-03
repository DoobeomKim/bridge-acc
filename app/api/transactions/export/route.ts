import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CATEGORY_LABELS } from '@/types'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 필터 조건 구성
    const where: any = {}

    // 날짜 범위 필터
    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        // 종료일은 해당 날짜의 23:59:59까지 포함
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.date.lte = end
      }
    }

    // 검색어 필터
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { counterparty: { contains: search } },
        { notes: { contains: search } },
      ]
    }

    // 카테고리 필터
    if (category && category !== 'all') {
      where.category = category
    }

    // 유형 필터 (수입/지출)
    if (type && type !== 'all') {
      if (type === 'income') {
        where.amount = { gt: 0 }
      } else if (type === 'expense') {
        where.amount = { lt: 0 }
      }
    }

    // 거래내역 조회 (첨부파일 포함)
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        attachments: {
          select: {
            fileName: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // CSV 생성
    const csvRows: string[] = []

    // 헤더
    csvRows.push([
      '날짜',
      '금액',
      '통화',
      '설명',
      '상대방',
      '카테고리',
      'VAT 세율(%)',
      'VAT 금액',
      '메모',
      '첨부파일',
    ].join(','))

    // 데이터 행
    for (const transaction of transactions) {
      const date = new Date(transaction.date).toISOString().split('T')[0]
      const amount = transaction.amount.toFixed(2)
      const currency = transaction.currency
      const description = escapeCSV(transaction.description)
      const counterparty = escapeCSV(transaction.counterparty || '')
      const category = transaction.category
        ? CATEGORY_LABELS[transaction.category] || transaction.category
        : ''
      const vatRate = transaction.vatRate !== null ? transaction.vatRate.toString() : ''
      const vatAmount = transaction.vatAmount !== null ? transaction.vatAmount.toFixed(2) : ''
      const notes = escapeCSV(transaction.notes || '')
      const attachments = transaction.attachments
        .map(a => a.fileName)
        .join('; ') // 세미콜론으로 구분

      csvRows.push([
        date,
        amount,
        currency,
        description,
        counterparty,
        category,
        vatRate,
        vatAmount,
        notes,
        escapeCSV(attachments),
      ].join(','))
    }

    const csv = csvRows.join('\n')

    // 파일명 생성 (날짜 범위 포함)
    const dateRangePart = startDate && endDate
      ? `_${startDate}_${endDate}`
      : startDate
      ? `_${startDate}_이후`
      : endDate
      ? `_${endDate}_이전`
      : ''
    const fileName = `거래내역${dateRangePart}_${new Date().toISOString().split('T')[0]}.csv`

    // UTF-8 BOM 추가 (Excel에서 한글 깨짐 방지)
    const bom = '\uFEFF'
    const csvWithBom = bom + csv

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting transactions:', error)
    return NextResponse.json(
      { success: false, error: 'CSV 내보내기 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// CSV 특수문자 이스케이프 함수
function escapeCSV(value: string): string {
  if (!value) return ''

  // 쉼표, 줄바꿈, 따옴표가 있으면 따옴표로 감싸고 내부 따옴표는 두 번 반복
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

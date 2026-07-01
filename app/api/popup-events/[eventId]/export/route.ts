import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  POPUP_EXPENSE_CATEGORY_LABELS,
  POPUP_PAYMENT_METHOD_LABELS,
} from '@/types'

export const dynamic = 'force-dynamic'

function escapeCsv(value: string | number | null | undefined) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const event = await prisma.popupEvent.findUnique({
      where: { id: params.eventId },
      include: {
        expenses: {
          orderBy: { date: 'desc' },
          include: {
            attachments: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Popup event not found' },
        { status: 404 }
      )
    }

    const rows = [
      [
        '행사명',
        '날짜',
        '거래처',
        '항목',
        '카테고리',
        '총액',
        '통화',
        'VAT율',
        'VAT금액',
        '결제수단',
        '확인상태',
        '첨부파일수',
        '메모',
      ],
    ]

    for (const expense of event.expenses) {
      rows.push([
        event.name,
        expense.date.toISOString().split('T')[0],
        expense.vendor,
        expense.itemName,
        expense.category ? POPUP_EXPENSE_CATEGORY_LABELS[expense.category] || expense.category : '',
        expense.grossAmount.toFixed(2),
        expense.currency,
        expense.vatRate !== null ? String(expense.vatRate) : '',
        expense.vatAmount !== null ? expense.vatAmount.toFixed(2) : '',
        expense.paymentMethod
          ? POPUP_PAYMENT_METHOD_LABELS[expense.paymentMethod] || expense.paymentMethod
          : '',
        expense.status === 'checked' ? '확인완료' : '미확인',
        String(expense.attachments.length),
        expense.notes || '',
      ])
    }

    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
    const bom = '\uFEFF'
    const date = new Date().toISOString().split('T')[0]
    const filename = `${event.name}_${date}.csv`

    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting popup event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export popup event' },
      { status: 500 }
    )
  }
}

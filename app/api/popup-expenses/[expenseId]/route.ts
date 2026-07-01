import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function parseNullableFloat(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const parsed = parseFloat(String(value))
  return Number.isNaN(parsed) ? null : parsed
}

function calculateVatAmount(grossAmount: number, vatRate: number | null) {
  if (vatRate === null) return null
  const netAmount = grossAmount / (1 + vatRate / 100)
  return Math.round((grossAmount - netAmount) * 100) / 100
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { expenseId: string } }
) {
  try {
    const body = await request.json()
    const grossAmount = parseNullableFloat(body.grossAmount)
    const vatRate = parseNullableFloat(body.vatRate)

    if (!body.date || !body.vendor || !body.itemName || grossAmount === null) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: date, vendor, itemName, grossAmount' },
        { status: 400 }
      )
    }

    const expense = await prisma.popupExpense.update({
      where: { id: params.expenseId },
      data: {
        date: new Date(body.date),
        vendor: body.vendor,
        itemName: body.itemName,
        category: body.category || null,
        grossAmount,
        currency: body.currency || 'EUR',
        vatRate,
        vatAmount: calculateVatAmount(grossAmount, vatRate),
        paymentMethod: body.paymentMethod || null,
        status: body.status || 'unchecked',
        notes: body.notes || null,
      },
      include: {
        attachments: true,
      },
    })

    return NextResponse.json({ success: true, data: expense })
  } catch (error) {
    console.error('Error updating popup expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update popup expense' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { expenseId: string } }
) {
  try {
    await prisma.popupExpense.delete({
      where: { id: params.expenseId },
    })

    return NextResponse.json({
      success: true,
      data: { id: params.expenseId },
    })
  } catch (error) {
    console.error('Error deleting popup expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete popup expense' },
      { status: 500 }
    )
  }
}

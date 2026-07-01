import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { uploadPopupExpenseAttachment } from '@/lib/blob-storage'

export const dynamic = 'force-dynamic'

function parseNullableFloat(value: FormDataEntryValue | null) {
  if (value === null || value === '') return null
  const parsed = parseFloat(value.toString())
  return Number.isNaN(parsed) ? null : parsed
}

function calculateVatAmount(grossAmount: number, vatRate: number | null) {
  if (vatRate === null) return null
  const netAmount = grossAmount / (1 + vatRate / 100)
  return Math.round((grossAmount - netAmount) * 100) / 100
}

function isUploadedFile(value: FormDataEntryValue): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    'arrayBuffer' in value &&
    'name' in value &&
    'size' in value &&
    'type' in value
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const event = await prisma.popupEvent.findUnique({
      where: { id: params.eventId },
    })

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Popup event not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const date = formData.get('date')?.toString()
    const vendor = formData.get('vendor')?.toString().trim()
    const itemName = formData.get('itemName')?.toString().trim()
    const grossAmount = parseNullableFloat(formData.get('grossAmount'))
    const vatRate = parseNullableFloat(formData.get('vatRate'))
    const files = formData.getAll('files').filter(isUploadedFile)

    if (!date || !vendor || !itemName || grossAmount === null) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: date, vendor, itemName, grossAmount' },
        { status: 400 }
      )
    }

    const expense = await prisma.popupExpense.create({
      data: {
        eventId: params.eventId,
        date: new Date(date),
        vendor,
        itemName,
        category: formData.get('category')?.toString() || null,
        grossAmount,
        currency: formData.get('currency')?.toString() || event.currency,
        vatRate,
        vatAmount: calculateVatAmount(grossAmount, vatRate),
        paymentMethod: formData.get('paymentMethod')?.toString() || null,
        status: formData.get('status')?.toString() || 'unchecked',
        notes: formData.get('notes')?.toString() || null,
      },
    })

    const attachments = []
    for (const file of files) {
      const upload = await uploadPopupExpenseAttachment(file, expense.id)
      const attachment = await prisma.popupExpenseAttachment.create({
        data: {
          expenseId: expense.id,
          fileName: upload.fileName,
          filePath: upload.url,
          fileSize: upload.fileSize,
          mimeType: upload.mimeType,
        },
      })
      attachments.push(attachment)
    }

    return NextResponse.json({
      success: true,
      data: { ...expense, attachments },
    })
  } catch (error) {
    console.error('Error creating popup expense:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create popup expense' },
      { status: 500 }
    )
  }
}

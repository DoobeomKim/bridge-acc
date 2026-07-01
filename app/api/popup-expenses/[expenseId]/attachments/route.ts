import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { uploadPopupExpenseAttachment } from '@/lib/blob-storage'

export const dynamic = 'force-dynamic'

const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

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

export async function GET(
  request: NextRequest,
  { params }: { params: { expenseId: string } }
) {
  try {
    const attachments = await prisma.popupExpenseAttachment.findMany({
      where: { expenseId: params.expenseId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: attachments })
  } catch (error) {
    console.error('Error fetching popup expense attachments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { expenseId: string } }
) {
  try {
    const expense = await prisma.popupExpense.findUnique({
      where: { id: params.expenseId },
    })

    if (!expense) {
      return NextResponse.json(
        { success: false, error: 'Popup expense not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files').filter(isUploadedFile)

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'File too large. Maximum size is 10MB.' },
          { status: 400 }
        )
      }

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid file type. Allowed: PDF, JPG, PNG, WEBP' },
          { status: 400 }
        )
      }
    }

    const attachments = []
    for (const file of files) {
      const upload = await uploadPopupExpenseAttachment(file, params.expenseId)
      const attachment = await prisma.popupExpenseAttachment.create({
        data: {
          expenseId: params.expenseId,
          fileName: upload.fileName,
          filePath: upload.url,
          fileSize: upload.fileSize,
          mimeType: upload.mimeType,
        },
      })
      attachments.push(attachment)
    }

    return NextResponse.json({ success: true, data: attachments })
  } catch (error) {
    console.error('Error uploading popup expense attachment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload attachment' },
      { status: 500 }
    )
  }
}

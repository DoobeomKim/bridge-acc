import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { del } from '@vercel/blob'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { expenseId: string; attachmentId: string } }
) {
  try {
    const attachment = await prisma.popupExpenseAttachment.findUnique({
      where: { id: params.attachmentId },
    })

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      )
    }

    const response = await fetch(attachment.filePath)
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'File not found on storage' },
        { status: 404 }
      )
    }

    const blob = await response.blob()
    const buffer = await blob.arrayBuffer()
    const disposition = request.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(attachment.fileName)}"`,
        'Content-Length': attachment.fileSize.toString(),
      },
    })
  } catch (error) {
    console.error('Error reading popup expense attachment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to read attachment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { expenseId: string; attachmentId: string } }
) {
  try {
    const attachment = await prisma.popupExpenseAttachment.findUnique({
      where: { id: params.attachmentId },
    })

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      )
    }

    await del(attachment.filePath)
    await prisma.popupExpenseAttachment.delete({
      where: { id: params.attachmentId },
    })

    return NextResponse.json({
      success: true,
      data: { id: params.attachmentId },
    })
  } catch (error) {
    console.error('Error deleting popup expense attachment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete attachment' },
      { status: 500 }
    )
  }
}

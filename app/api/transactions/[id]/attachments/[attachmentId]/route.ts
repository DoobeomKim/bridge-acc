import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'

/**
 * GET /api/transactions/:id/attachments/:attachmentId
 * 첨부파일 다운로드
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const { attachmentId } = params

    const attachment = await prisma.transactionAttachment.findUnique({
      where: { id: attachmentId },
    })

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      )
    }

    const filePath = join(process.cwd(), attachment.filePath)

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'File not found on server' },
        { status: 404 }
      )
    }

    const fileBuffer = await readFile(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
        'Content-Length': attachment.fileSize.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading attachment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to download attachment',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/transactions/:id/attachments/:attachmentId
 * 첨부파일 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const { attachmentId } = params

    const attachment = await prisma.transactionAttachment.findUnique({
      where: { id: attachmentId },
    })

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      )
    }

    const filePath = join(process.cwd(), attachment.filePath)

    // 파일 삭제
    if (existsSync(filePath)) {
      await unlink(filePath)
    }

    // DB에서 삭제
    await prisma.transactionAttachment.delete({
      where: { id: attachmentId },
    })

    return NextResponse.json({
      success: true,
      data: { id: attachmentId },
    })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete attachment',
      },
      { status: 500 }
    )
  }
}

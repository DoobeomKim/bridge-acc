import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { del } from '@vercel/blob'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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

    // Check if file is on Vercel Blob (URL) or local filesystem
    if (attachment.filePath.startsWith('http://') || attachment.filePath.startsWith('https://')) {
      // File is on Vercel Blob - fetch and stream
      const response = await fetch(attachment.filePath)

      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: 'File not found on Blob storage' },
          { status: 404 }
        )
      }

      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': attachment.mimeType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
          'Content-Length': attachment.fileSize.toString(),
        },
      })
    } else {
      // File is on local filesystem (for development)
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
    }
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

    // Check if file is on Vercel Blob or local filesystem
    if (attachment.filePath.startsWith('http://') || attachment.filePath.startsWith('https://')) {
      // Delete from Vercel Blob
      await del(attachment.filePath)
    } else {
      // Delete from local filesystem
      const filePath = join(process.cwd(), attachment.filePath)
      if (existsSync(filePath)) {
        await unlink(filePath)
      }
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

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { join } from 'path'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * GET /api/transactions/:id/attachments/:attachmentId/view
 * 첨부파일 미리보기 (브라우저에서 열기)
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
          'Content-Disposition': `inline; filename="${encodeURIComponent(attachment.fileName)}"`,
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

      // inline으로 설정하여 브라우저에서 바로 열리도록
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': attachment.mimeType,
          'Content-Disposition': `inline; filename="${encodeURIComponent(attachment.fileName)}"`,
          'Content-Length': attachment.fileSize.toString(),
        },
      })
    }
  } catch (error) {
    console.error('Error viewing attachment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to view attachment',
      },
      { status: 500 }
    )
  }
}

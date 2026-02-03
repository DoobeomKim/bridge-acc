import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * GET /api/transactions/:id/attachments
 * 거래의 모든 첨부파일 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const attachments = await prisma.transactionAttachment.findMany({
      where: { transactionId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: attachments,
    })
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attachments',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transactions/:id/attachments
 * 첨부파일 업로드
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: transactionId } = params

    // 거래 존재 확인
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    // 파일 크기 제한 (10MB per file)
    const maxSize = 10 * 1024 * 1024
    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json(
          {
            success: false,
            error: `File ${file.name} is too large. Maximum size is 10MB.`,
          },
          { status: 400 }
        )
      }
    }

    // 저장 디렉토리 생성
    const uploadDir = join(process.cwd(), 'uploads', 'transactions', transactionId)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const savedAttachments = []

    for (const file of files) {
      // 파일명 sanitize (경로 traversal 방지)
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const timestamp = Date.now()
      const uniqueFileName = `${timestamp}_${sanitizedFileName}`
      const filePath = join(uploadDir, uniqueFileName)

      // 파일 저장
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      // DB에 메타데이터 저장
      const attachment = await prisma.transactionAttachment.create({
        data: {
          transactionId,
          fileName: file.name,
          filePath: `uploads/transactions/${transactionId}/${uniqueFileName}`,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
        },
      })

      savedAttachments.push(attachment)
    }

    return NextResponse.json({
      success: true,
      data: savedAttachments,
    })
  } catch (error) {
    console.error('Error uploading attachments:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload attachments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

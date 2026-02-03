import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadTransactionAttachment } from '@/lib/blob-storage';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * POST /api/transactions/[id]/attachments
 * 거래내역에 첨부파일 업로드 (영수증, 인보이스 등)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transactionId = params.id;

    // 거래내역 존재 확인
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // 허용된 파일 타입
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Allowed: PDF, JPG, PNG, WEBP',
        },
        { status: 400 }
      );
    }

    // Vercel Blob에 업로드
    const uploadResult = await uploadTransactionAttachment(file, transactionId);

    // DB에 첨부파일 정보 저장
    const attachment = await prisma.transactionAttachment.create({
      data: {
        transactionId,
        fileName: uploadResult.fileName,
        filePath: uploadResult.url,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
      },
    });

    return NextResponse.json({
      success: true,
      data: attachment,
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload attachment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transactions/[id]/attachments
 * 거래내역의 첨부파일 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transactionId = params.id;

    const attachments = await prisma.transactionAttachment.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attachments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

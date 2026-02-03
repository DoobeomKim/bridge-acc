import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parseVividCsv } from '@/lib/csv-parser'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /api/transactions/upload
 * Vivid CSV 파일 업로드 및 거래내역 import
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bankAccountId = formData.get('bankAccountId') as string

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      )
    }

    // 파일 타입 검증
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Please upload a CSV file.',
        },
        { status: 400 }
      )
    }

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'File too large. Maximum size is 10MB.',
        },
        { status: 400 }
      )
    }

    // 은행 계좌 확인 또는 생성
    let account = null
    if (bankAccountId) {
      account = await prisma.bankAccount.findUnique({
        where: { id: bankAccountId },
      })
    }

    if (!account) {
      // 기본 계좌 생성
      account = await prisma.bankAccount.create({
        data: {
          accountName: 'Vivid Geschäftskonto',
          bankName: 'Vivid',
        },
      })
    }

    // CSV 파일 읽기
    const csvContent = await file.text()

    // 기존 해시 가져오기 (중복 방지)
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        bankAccountId: account.id,
        csvRowHash: { not: null },
      },
      select: {
        csvRowHash: true,
      },
    })
    const existingHashes = new Set(
      existingTransactions
        .map((t) => t.csvRowHash)
        .filter((h): h is string => h !== null)
    )

    // CSV 파싱
    const parseResult = await parseVividCsv(csvContent, existingHashes)

    if (!parseResult.success && parseResult.transactions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse CSV file',
          details: parseResult.errors,
        },
        { status: 400 }
      )
    }

    // Import batch ID 생성
    const importBatchId = uuidv4()

    // 거래내역 DB에 저장
    const createdTransactions = await prisma.$transaction(
      parseResult.transactions.map((transaction) =>
        prisma.transaction.create({
          data: {
            bankAccountId: account.id,
            source: 'csv',
            date: transaction.date,
            amount: transaction.amount,
            currency: transaction.currency,
            description: transaction.description,
            counterparty: transaction.counterparty,
            csvRowHash: transaction.csvRowHash,
            importBatchId,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      data: {
        imported: createdTransactions.length,
        duplicates: parseResult.duplicates,
        errors: parseResult.errors,
        importBatchId,
        transactions: createdTransactions,
      },
    })
  } catch (error) {
    console.error('Error uploading CSV:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload and process CSV file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

import { prisma } from '@/lib/db'
import { createHash } from 'crypto'

/**
 * 강화된 중복 방지 로직
 * API, CSV, 수동 입력 모두 처리
 */

/**
 * 거래 고유 해시 생성 (날짜 + 금액 + 설명)
 */
export function generateTransactionHash(
  date: Date | string,
  amount: number,
  description: string
): string {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
  const hashInput = `${dateStr}|${amount}|${description}`
  return createHash('sha256').update(hashInput).digest('hex').substring(0, 16)
}

/**
 * 중복 거래 체크
 * @returns { isDuplicate: boolean, matchedTransaction?: Transaction }
 */
export async function checkDuplicate(params: {
  bankAccountId: string
  externalId?: string | null
  csvRowHash?: string | null
  date: Date
  amount: number
  description: string
}): Promise<{ isDuplicate: boolean; matchedTransactionId?: string }> {
  const { bankAccountId, externalId, csvRowHash, date, amount, description } = params

  // Strategy 1: Check by externalId (API 거래)
  if (externalId) {
    const existing = await prisma.transaction.findFirst({
      where: {
        bankAccountId,
        externalId,
      },
      select: { id: true },
    })

    if (existing) {
      return { isDuplicate: true, matchedTransactionId: existing.id }
    }
  }

  // Strategy 2: Check by csvRowHash (CSV 거래)
  if (csvRowHash) {
    const existing = await prisma.transaction.findFirst({
      where: {
        bankAccountId,
        csvRowHash,
      },
      select: { id: true },
    })

    if (existing) {
      return { isDuplicate: true, matchedTransactionId: existing.id }
    }
  }

  // Strategy 3: Check by transaction hash (날짜 + 금액 + 설명)
  // 같은 날짜, 금액, 설명이 있는지 확인
  const existing = await prisma.transaction.findFirst({
    where: {
      bankAccountId,
      date,
      amount,
      description,
    },
    select: { id: true },
  })

  if (existing) {
    return { isDuplicate: true, matchedTransactionId: existing.id }
  }

  return { isDuplicate: false }
}

/**
 * 대량 중복 체크 (배치용)
 */
export async function checkBatchDuplicates(
  bankAccountId: string,
  transactions: Array<{
    externalId?: string | null
    csvRowHash?: string | null
    date: Date
    amount: number
    description: string
  }>
): Promise<Map<number, boolean>> {
  const results = new Map<number, boolean>()

  // Get all existing external IDs
  const externalIds = transactions
    .map((t) => t.externalId)
    .filter((id): id is string => !!id)

  const existingExternalIds = new Set(
    (
      await prisma.transaction.findMany({
        where: {
          bankAccountId,
          externalId: { in: externalIds },
        },
        select: { externalId: true },
      })
    ).map((t) => t.externalId)
  )

  // Get all existing CSV hashes
  const csvHashes = transactions
    .map((t) => t.csvRowHash)
    .filter((h): h is string => !!h)

  const existingCsvHashes = new Set(
    (
      await prisma.transaction.findMany({
        where: {
          bankAccountId,
          csvRowHash: { in: csvHashes },
        },
        select: { csvRowHash: true },
      })
    ).map((t) => t.csvRowHash)
  )

  // Check each transaction
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i]

    // Check external ID
    if (tx.externalId && existingExternalIds.has(tx.externalId)) {
      results.set(i, true)
      continue
    }

    // Check CSV hash
    if (tx.csvRowHash && existingCsvHashes.has(tx.csvRowHash)) {
      results.set(i, true)
      continue
    }

    // Check by date + amount + description
    const existing = await prisma.transaction.findFirst({
      where: {
        bankAccountId,
        date: tx.date,
        amount: tx.amount,
        description: tx.description,
      },
      select: { id: true },
    })

    results.set(i, !!existing)
  }

  return results
}

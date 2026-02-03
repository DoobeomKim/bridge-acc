/**
 * 독일 규정에 맞는 인보이스/견적서 번호 생성
 * - 연속성 보장 (lückenlose Nummernfolge)
 * - Race condition 방지 (Prisma 트랜잭션)
 * - 연도별 리셋 지원
 */

import { prisma } from '@/lib/db';

/**
 * 인보이스 번호 생성
 * 형식: BM-2026-001, BM-2026-002, ...
 *
 * @returns 생성된 인보이스 번호 (예: "BM-2026-001")
 * @throws Error - Settings를 찾을 수 없거나 알 수 없는 형식인 경우
 */
export async function generateInvoiceNumber(): Promise<string> {
  const settings = await prisma.settings.findFirst();

  if (!settings) {
    throw new Error('Settings not found. Please initialize settings first.');
  }

  const { invoicePrefix, numberFormat, numberPadding } = settings;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Prisma 트랜잭션으로 동시성 문제 해결
  const result = await prisma.$transaction(async (tx) => {
    // 1. 현재 시퀀스 가져오기 (또는 생성)
    let sequence = await tx.numberSequence.findUnique({
      where: {
        type_year_month: {
          type: 'invoice',
          year: numberFormat === 'YEAR' || numberFormat === 'MONTH' ? year : 0,
          month: numberFormat === 'MONTH' ? month : 0,
        },
      },
    });

    if (!sequence) {
      // 시퀀스가 없으면 새로 생성
      sequence = await tx.numberSequence.create({
        data: {
          type: 'invoice',
          year: numberFormat === 'YEAR' || numberFormat === 'MONTH' ? year : 0,
          month: numberFormat === 'MONTH' ? month : 0,
          lastNumber: 0,
        },
      });
    }

    // 2. 번호 증가
    const nextNumber = sequence.lastNumber + 1;

    // 3. 시퀀스 업데이트
    await tx.numberSequence.update({
      where: { id: sequence.id },
      data: { lastNumber: nextNumber },
    });

    return { nextNumber, year, month };
  });

  // 4. 포맷팅
  const paddedNumber = result.nextNumber.toString().padStart(numberPadding, '0');

  switch (numberFormat) {
    case 'YEAR':
      return `${invoicePrefix}-${result.year}-${paddedNumber}`;
      // 예: BM-2026-001

    case 'MONTH':
      const paddedMonth = result.month.toString().padStart(2, '0');
      return `${invoicePrefix}-${result.year}-${paddedMonth}-${paddedNumber}`;
      // 예: BM-2026-01-001

    case 'CONTINUOUS':
      return `${invoicePrefix}-${paddedNumber}`;
      // 예: BM-00001

    default:
      throw new Error(`Unknown number format: ${numberFormat}`);
  }
}

/**
 * 견적서 번호 생성
 * 형식: BM-ANB-2026-001, BM-ANB-2026-002, ...
 *
 * @returns 생성된 견적서 번호 (예: "BM-ANB-2026-001")
 * @throws Error - Settings를 찾을 수 없거나 알 수 없는 형식인 경우
 */
export async function generateQuoteNumber(): Promise<string> {
  const settings = await prisma.settings.findFirst();

  if (!settings) {
    throw new Error('Settings not found. Please initialize settings first.');
  }

  const { quotePrefix, numberFormat, numberPadding } = settings;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const result = await prisma.$transaction(async (tx) => {
    let sequence = await tx.numberSequence.findUnique({
      where: {
        type_year_month: {
          type: 'quote',
          year: numberFormat === 'YEAR' || numberFormat === 'MONTH' ? year : 0,
          month: numberFormat === 'MONTH' ? month : 0,
        },
      },
    });

    if (!sequence) {
      sequence = await tx.numberSequence.create({
        data: {
          type: 'quote',
          year: numberFormat === 'YEAR' || numberFormat === 'MONTH' ? year : 0,
          month: numberFormat === 'MONTH' ? month : 0,
          lastNumber: 0,
        },
      });
    }

    const nextNumber = sequence.lastNumber + 1;

    await tx.numberSequence.update({
      where: { id: sequence.id },
      data: { lastNumber: nextNumber },
    });

    return { nextNumber, year, month };
  });

  const paddedNumber = result.nextNumber.toString().padStart(numberPadding, '0');

  switch (numberFormat) {
    case 'YEAR':
      return `${quotePrefix}-${result.year}-${paddedNumber}`;
      // 예: BM-ANB-2026-001

    case 'MONTH':
      const paddedMonth = result.month.toString().padStart(2, '0');
      return `${quotePrefix}-${result.year}-${paddedMonth}-${paddedNumber}`;
      // 예: BM-ANB-2026-01-001

    case 'CONTINUOUS':
      return `${quotePrefix}-${paddedNumber}`;
      // 예: BM-ANB-00001

    default:
      throw new Error(`Unknown number format: ${numberFormat}`);
  }
}

/**
 * 고객 번호 생성
 * 형식: KD-001, KD-002, ...
 *
 * @returns 생성된 고객 번호 (예: "KD-001")
 */
export async function generateCustomerNumber(): Promise<string> {
  const result = await prisma.$transaction(async (tx) => {
    let sequence = await tx.numberSequence.findUnique({
      where: {
        type_year_month: {
          type: 'customer',
          year: 0,
          month: 0,
        },
      },
    });

    if (!sequence) {
      sequence = await tx.numberSequence.create({
        data: {
          type: 'customer',
          year: 0,
          month: 0,
          lastNumber: 0,
        },
      });
    }

    const nextNumber = sequence.lastNumber + 1;

    await tx.numberSequence.update({
      where: { id: sequence.id },
      data: { lastNumber: nextNumber },
    });

    return nextNumber;
  });

  return `KD-${result.toString().padStart(3, '0')}`;
  // 예: KD-001, KD-002, ...
}

/**
 * 현재 시퀀스 번호 조회 (테스트용)
 */
export async function getCurrentSequence(
  type: 'invoice' | 'quote' | 'customer'
): Promise<number> {
  const settings = await prisma.settings.findFirst();

  if (!settings) {
    return 0;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const sequence = await prisma.numberSequence.findUnique({
    where: {
      type_year_month: {
        type,
        year: type === 'customer' ? 0 : (settings.numberFormat === 'YEAR' || settings.numberFormat === 'MONTH' ? year : 0),
        month: type === 'customer' ? 0 : (settings.numberFormat === 'MONTH' ? month : 0),
      },
    },
  });

  return sequence?.lastNumber || 0;
}

/**
 * 시퀀스 초기화 (관리자 전용 - 주의!)
 */
export async function resetSequence(
  type: 'invoice' | 'quote' | 'customer',
  year?: number,
  month?: number
): Promise<void> {
  await prisma.numberSequence.deleteMany({
    where: {
      type,
      ...(year && { year }),
      ...(month && { month }),
    },
  });
}

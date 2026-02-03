/**
 * 인보이스 액션 - 취소/정정 로직
 * 독일 세법 준수: 발행된 인보이스는 수정 불가, 대신 취소/정정 인보이스 발행
 */

import { prisma } from '@/lib/db';
import { generateInvoiceNumber } from '@/lib/invoice-number';

/**
 * 취소 인보이스 (Stornierung/Storno) 생성
 *
 * 원본 인보이스를 완전히 무효화하는 마이너스 금액 인보이스 발행
 *
 * @param invoiceId - 취소할 원본 인보이스 ID
 * @param reason - 취소 사유
 * @returns 생성된 취소 인보이스
 */
export async function cancelInvoice(invoiceId: string, reason: string) {
  // 원본 인보이스 조회
  const original = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
      customer: true,
    },
  });

  if (!original) {
    throw new Error('Invoice not found');
  }

  // 검증: draft는 취소 불가 (직접 삭제)
  if (original.status === 'draft') {
    throw new Error('Cannot cancel draft invoice. Delete it instead.');
  }

  // 검증: 이미 취소된 인보이스
  if (original.isCancelled) {
    throw new Error('Invoice is already cancelled');
  }

  // 검증: 잠기지 않은 인보이스는 취소 불가
  if (!original.isLocked) {
    throw new Error('Only locked (sent/paid) invoices can be cancelled');
  }

  // 새 인보이스 번호 생성
  const cancellationNumber = await generateInvoiceNumber();

  // 취소 인보이스 생성 (마이너스 금액)
  const cancellation = await prisma.invoice.create({
    data: {
      invoiceNumber: cancellationNumber,
      customerId: original.customerId,
      correctionType: 'cancellation',
      correctsId: original.id,

      // 날짜
      invoiceDate: new Date(),
      dueDate: new Date(), // 취소 인보이스는 즉시 처리
      paymentTerms: 'Stornierung - keine Zahlung erforderlich',

      // 마이너스 금액
      subtotal: -original.subtotal,
      totalVat: -original.totalVat,
      totalGross: -original.totalGross,

      // 메타 정보
      notes: `Stornierung von Rechnung ${original.invoiceNumber}\n\nGrund: ${reason}`,
      terms: original.terms,

      // 상태
      status: 'sent', // 취소 인보이스는 즉시 발송 상태
      isLocked: true, // 취소 인보이스도 잠금
      isEditable: false,
      lockedAt: new Date(),

      // 항목 복사 (마이너스 수량)
      items: {
        create: original.items.map((item) => ({
          description: `[STORNO] ${item.description}`,
          quantity: -item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          subtotal: -item.subtotal,
          vatAmount: -item.vatAmount,
          total: -item.total,
          sortOrder: item.sortOrder,
        })),
      },
    },
    include: {
      customer: true,
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  // 원본 인보이스에 취소 표시
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      isCancelled: true,
      cancelledAt: new Date(),
      cancellationReason: reason,
      correctedById: cancellation.id,
    },
  });

  return cancellation;
}

/**
 * 정정 인보이스 (Korrekturrechnung) 생성
 *
 * 소액 조정 시 차액만 청구하는 인보이스 발행
 *
 * @param invoiceId - 정정할 원본 인보이스 ID
 * @param corrections - 정정 내용 { items, reason }
 * @returns 생성된 정정 인보이스
 */
export async function createCorrectionInvoice(
  invoiceId: string,
  corrections: {
    items: Array<{
      description: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      vatRate: number;
    }>;
    reason: string;
  }
) {
  // 원본 인보이스 조회
  const original = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
    },
  });

  if (!original) {
    throw new Error('Invoice not found');
  }

  // 검증
  if (original.status === 'draft') {
    throw new Error('Cannot correct draft invoice. Edit it directly.');
  }

  if (original.isCancelled) {
    throw new Error('Cannot correct cancelled invoice');
  }

  // 새 인보이스 번호 생성
  const correctionNumber = await generateInvoiceNumber();

  // 항목 계산
  const calculatedItems = corrections.items.map((item, index) => {
    const subtotal = item.quantity * item.unitPrice;
    const vatAmount = subtotal * (item.vatRate / 100);
    const total = subtotal + vatAmount;

    return {
      description: `[KORREKTUR] ${item.description}`,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
      subtotal,
      vatAmount,
      total,
      sortOrder: index,
    };
  });

  const subtotal = calculatedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalVat = calculatedItems.reduce((sum, item) => sum + item.vatAmount, 0);
  const totalGross = subtotal + totalVat;

  // 정정 인보이스 생성
  const correction = await prisma.invoice.create({
    data: {
      invoiceNumber: correctionNumber,
      customerId: original.customerId,
      correctionType: 'correction',
      correctsId: original.id,

      // 날짜
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14일 후
      paymentTerms: original.paymentTerms,

      // 차액
      subtotal,
      totalVat,
      totalGross,

      // 메타 정보
      notes: `Korrekturrechnung zu Rechnung ${original.invoiceNumber}\n\nGrund: ${corrections.reason}`,
      terms: original.terms,

      // 상태
      status: 'sent',
      isLocked: true,
      isEditable: false,
      lockedAt: new Date(),

      // 항목
      items: {
        create: calculatedItems,
      },
    },
    include: {
      customer: true,
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  // 원본 인보이스에 정정 표시
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      correctedById: correction.id,
    },
  });

  return correction;
}

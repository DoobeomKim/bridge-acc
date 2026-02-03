/**
 * 견적서 → 인보이스 전환 API
 * POST /api/quotes/[id]/convert
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateInvoiceNumber } from '@/lib/invoice-number';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/quotes/[id]/convert
 * 견적서를 인보이스로 전환
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    // 견적서 조회
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        invoice: true,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // 이미 인보이스로 전환된 경우
    if (quote.invoice) {
      return NextResponse.json(
        { error: 'Quote has already been converted to invoice', invoice: quote.invoice },
        { status: 400 }
      );
    }

    // 인보이스 번호 생성
    const invoiceNumber = await generateInvoiceNumber();

    // 날짜 설정
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14일 후

    // 견적서 항목을 인보이스 항목으로 복사
    const invoiceItems = quote.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
      subtotal: item.subtotal,
      vatAmount: item.vatAmount,
      total: item.total,
      sortOrder: item.sortOrder,
    }));

    // 인보이스 생성
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: quote.customerId,
        quoteId: quote.id,
        invoiceDate,
        dueDate,
        paymentTerms: '14 Tage netto',
        subtotal: quote.subtotal,
        totalVat: quote.totalVat,
        totalGross: quote.totalGross,
        notes: quote.notes,
        terms: quote.terms,
        items: {
          create: invoiceItems,
        },
      },
      include: {
        customer: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        quote: true,
      },
    });

    // 견적서 상태를 'accepted'로 변경 (선택사항)
    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Failed to convert quote to invoice:', error);
    return NextResponse.json(
      { error: 'Failed to convert quote to invoice' },
      { status: 500 }
    );
  }
}

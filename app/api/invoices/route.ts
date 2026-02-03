/**
 * 인보이스 API - 목록 조회 및 생성
 * GET /api/invoices - 전체 인보이스 목록
 * POST /api/invoices - 새 인보이스 생성
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateInvoiceNumber } from '@/lib/invoice-number';

/**
 * GET /api/invoices
 * 전체 인보이스 목록 조회
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    // 연체 상태 자동 판단을 위해 모든 인보이스 조회
    const invoices = await prisma.invoice.findMany({
      where: {
        ...(status && status !== 'overdue' && { status }),
        ...(customerId && { customerId }),
      },
      orderBy: {
        invoiceDate: 'desc',
      },
      include: {
        customer: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        quote: {
          select: {
            quoteNumber: true,
          },
        },
      },
    });

    // 연체 상태 필터링 (sent 상태이면서 due date 지난 것)
    let filteredInvoices = invoices;
    if (status === 'overdue') {
      const now = new Date();
      filteredInvoices = invoices.filter(
        (inv) => inv.status === 'sent' && inv.dueDate < now
      );
    }

    return NextResponse.json(filteredInvoices);
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices
 * 새 인보이스 생성
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      quoteId,
      items = [],
      invoiceDate,
      deliveryDate,
      dueDate,
      paymentTerms,
      notes,
      terms,
    } = body;

    // 필수 필드 검증
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // 고객 존재 확인
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // 인보이스 번호 자동 생성
    const invoiceNumber = await generateInvoiceNumber();

    // 날짜 기본값
    const defaultInvoiceDate = invoiceDate ? new Date(invoiceDate) : new Date();
    const defaultDueDate = dueDate
      ? new Date(dueDate)
      : new Date(defaultInvoiceDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14일 후

    // 항목 합계 계산
    const calculatedItems = items.map((item: any, index: number) => {
      const subtotal = item.quantity * item.unitPrice;
      const vatAmount = subtotal * (item.vatRate / 100);
      const total = subtotal + vatAmount;

      return {
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'Stück',
        unitPrice: item.unitPrice,
        vatRate: item.vatRate || 19,
        subtotal,
        vatAmount,
        total,
        sortOrder: index,
      };
    });

    const subtotal = calculatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalVat = calculatedItems.reduce((sum, item) => sum + item.vatAmount, 0);
    const totalGross = subtotal + totalVat;

    // 인보이스 생성
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        quoteId: quoteId || null,
        invoiceDate: defaultInvoiceDate,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        dueDate: defaultDueDate,
        paymentTerms: paymentTerms || '14 Tage netto',
        notes,
        terms,
        subtotal,
        totalVat,
        totalGross,
        items: {
          create: calculatedItems,
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

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

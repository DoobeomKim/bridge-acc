/**
 * 견적서 API - 목록 조회 및 생성
 * GET /api/quotes - 전체 견적서 목록
 * POST /api/quotes - 새 견적서 생성
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateQuoteNumber } from '@/lib/invoice-number';

/**
 * GET /api/quotes
 * 전체 견적서 목록 조회
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const quotes = await prisma.quote.findMany({
      where: {
        ...(status && { status }),
        ...(customerId && { customerId }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Failed to fetch quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quotes
 * 새 견적서 생성
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      items = [],
      validUntil,
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

    // 견적서 번호 자동 생성
    const quoteNumber = await generateQuoteNumber();

    // 유효기간 기본값 (30일 후)
    const defaultValidUntil = new Date();
    defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);

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

    // 견적서 생성
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId,
        validUntil: validUntil ? new Date(validUntil) : defaultValidUntil,
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
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('Failed to create quote:', error);
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    );
  }
}

/**
 * 고객 API - 목록 조회 및 생성
 * GET /api/customers - 전체 고객 목록
 * POST /api/customers - 새 고객 생성
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateCustomerNumber } from '@/lib/invoice-number';

/**
 * GET /api/customers
 * 전체 고객 목록 조회
 */
export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            quotes: true,
            invoices: true,
          },
        },
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers
 * 새 고객 생성
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      company,
      address,
      postalCode,
      city,
      country = 'DE',
      vatId,
      taxExempt = false,
    } = body;

    // 필수 필드 검증
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // 고객 번호 자동 생성
    const customerNumber = await generateCustomerNumber();

    // 고객 생성
    const customer = await prisma.customer.create({
      data: {
        customerNumber,
        name,
        email,
        company,
        address,
        postalCode,
        city,
        country,
        vatId,
        taxExempt,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Failed to create customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

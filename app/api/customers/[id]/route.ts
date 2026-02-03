/**
 * 고객 API - 상세 조회, 수정, 삭제
 * GET /api/customers/[id] - 고객 상세 정보
 * PATCH /api/customers/[id] - 고객 정보 수정
 * DELETE /api/customers/[id] - 고객 삭제
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/customers/[id]
 * 고객 상세 정보 조회
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const customer = await prisma.customer.findUnique({
      where: {
        id: params.id,
      },
      include: {
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/customers/[id]
 * 고객 정보 수정
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      company,
      address,
      postalCode,
      city,
      country,
      vatId,
      taxExempt,
    } = body;

    // 고객 존재 확인
    const existing = await prisma.customer.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // 고객 정보 업데이트
    const customer = await prisma.customer.update({
      where: {
        id: params.id,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(company !== undefined && { company }),
        ...(address !== undefined && { address }),
        ...(postalCode !== undefined && { postalCode }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(vatId !== undefined && { vatId }),
        ...(taxExempt !== undefined && { taxExempt }),
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Failed to update customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customers/[id]
 * 고객 삭제
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // 고객 존재 확인
    const existing = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            quotes: true,
            invoices: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // 견적서나 인보이스가 있으면 삭제 불가
    if (existing._count.quotes > 0 || existing._count.invoices > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete customer with existing quotes or invoices',
          details: {
            quotes: existing._count.quotes,
            invoices: existing._count.invoices,
          },
        },
        { status: 400 }
      );
    }

    // 고객 삭제
    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}

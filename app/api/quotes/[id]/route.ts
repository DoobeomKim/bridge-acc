/**
 * 견적서 API - 상세 조회, 수정, 삭제
 * GET /api/quotes/[id] - 견적서 상세 정보
 * PATCH /api/quotes/[id] - 견적서 수정
 * DELETE /api/quotes/[id] - 견적서 삭제
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/quotes/[id]
 * 견적서 상세 정보 조회
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
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

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Failed to fetch quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/quotes/[id]
 * 견적서 수정
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const {
      items,
      validUntil,
      notes,
      terms,
      status,
    } = body;

    // 견적서 존재 확인
    const existing = await prisma.quote.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // 편집 불가 상태 확인
    if (!existing.isEditable && status !== 'accepted' && status !== 'rejected') {
      return NextResponse.json(
        { error: 'Quote is not editable. Create a new version instead.' },
        { status: 400 }
      );
    }

    // 항목 업데이트가 있으면 재계산
    let updateData: any = {
      ...(validUntil !== undefined && { validUntil: new Date(validUntil) }),
      ...(notes !== undefined && { notes }),
      ...(terms !== undefined && { terms }),
      ...(status !== undefined && { status }),
      lastEditedAt: new Date(),
    };

    if (items) {
      // 기존 항목 삭제
      await prisma.quoteItem.deleteMany({
        where: { quoteId: params.id },
      });

      // 새 항목 계산 및 추가
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

      updateData = {
        ...updateData,
        subtotal,
        totalVat,
        totalGross,
        items: {
          create: calculatedItems,
        },
      };
    }

    // 발송 시 편집 불가로 설정
    if (status === 'sent') {
      updateData.sentAt = new Date();
      updateData.isEditable = false;
    }

    // 승인 시
    if (status === 'accepted') {
      updateData.acceptedAt = new Date();
    }

    // 견적서 업데이트
    const quote = await prisma.quote.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Failed to update quote:', error);
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quotes/[id]
 * 견적서 삭제
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // 견적서 존재 확인
    const existing = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        invoice: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // 인보이스로 전환된 견적서는 삭제 불가
    if (existing.invoice) {
      return NextResponse.json(
        { error: 'Cannot delete quote that has been converted to invoice' },
        { status: 400 }
      );
    }

    // 견적서 삭제 (항목도 자동 삭제 - Cascade)
    await prisma.quote.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete quote:', error);
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    );
  }
}

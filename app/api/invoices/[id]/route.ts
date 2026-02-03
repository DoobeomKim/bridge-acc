/**
 * 인보이스 API - 상세 조회, 수정, 삭제
 * GET /api/invoices/[id] - 인보이스 상세 정보
 * PATCH /api/invoices/[id] - 인보이스 수정 (draft만)
 * DELETE /api/invoices/[id] - 인보이스 삭제 (draft만)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/invoices/[id]
 * 인보이스 상세 정보 조회
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        quote: {
          select: {
            quoteNumber: true,
            id: true,
          },
        },
        transaction: true,
        corrects: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
        correctedBy: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/invoices/[id]
 * 인보이스 수정 (draft 상태만 가능)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const {
      items,
      invoiceDate,
      deliveryDate,
      dueDate,
      paymentTerms,
      notes,
      terms,
      status,
      paidAt,
      paidAmount,
      paymentMethod,
    } = body;

    // 인보이스 존재 확인
    const existing = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // 잠긴 인보이스는 수정 불가 (결제 상태 변경 제외)
    if (existing.isLocked && !status && !paidAt) {
      return NextResponse.json(
        { error: 'Invoice is locked and cannot be edited. Create a cancellation or correction invoice instead.' },
        { status: 400 }
      );
    }

    // draft가 아닌 인보이스는 항목 수정 불가
    if (existing.status !== 'draft' && items) {
      return NextResponse.json(
        { error: 'Cannot edit items of sent invoice. Create a cancellation invoice instead.' },
        { status: 400 }
      );
    }

    // 항목 업데이트가 있으면 재계산
    let updateData: any = {
      ...(invoiceDate !== undefined && { invoiceDate: new Date(invoiceDate) }),
      ...(deliveryDate !== undefined && { deliveryDate: deliveryDate ? new Date(deliveryDate) : null }),
      ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
      ...(paymentTerms !== undefined && { paymentTerms }),
      ...(notes !== undefined && { notes }),
      ...(terms !== undefined && { terms }),
      ...(status !== undefined && { status }),
      ...(paymentMethod !== undefined && { paymentMethod }),
    };

    if (items) {
      // 기존 항목 삭제
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
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

    // 발송 시 영구 잠금 (독일 세법)
    if (status === 'sent' && !existing.isLocked) {
      updateData.isLocked = true;
      updateData.lockedAt = new Date();
      updateData.isEditable = false;
    }

    // 결제 완료 처리
    if (status === 'paid' || paidAt) {
      updateData.status = 'paid';
      updateData.paidAt = paidAt ? new Date(paidAt) : new Date();
      if (paidAmount !== undefined) {
        updateData.paidAmount = paidAmount;
      } else if (!existing.paidAmount) {
        updateData.paidAmount = existing.totalGross;
      }
    }

    // 인보이스 업데이트
    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        quote: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Failed to update invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoices/[id]
 * 인보이스 삭제 (draft만 가능)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // 인보이스 존재 확인
    const existing = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // 잠긴 인보이스는 삭제 불가
    if (existing.isLocked) {
      return NextResponse.json(
        { error: 'Cannot delete locked invoice. Create a cancellation invoice instead.' },
        { status: 400 }
      );
    }

    // draft가 아닌 인보이스는 삭제 불가
    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Cannot delete sent invoice. Create a cancellation invoice instead.' },
        { status: 400 }
      );
    }

    // 인보이스 삭제 (항목도 자동 삭제 - Cascade)
    await prisma.invoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete invoice:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}

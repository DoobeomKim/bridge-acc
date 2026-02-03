/**
 * 인보이스 취소 API
 * POST /api/invoices/[id]/cancel
 */

import { NextResponse } from 'next/server';
import { cancelInvoice } from '@/lib/invoice-actions';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/invoices/[id]/cancel
 * 인보이스 취소 (Stornierung)
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { reason } = body;

    // 필수 필드 검증
    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    // 취소 인보이스 생성
    const cancellation = await cancelInvoice(params.id, reason);

    return NextResponse.json(cancellation, { status: 201 });
  } catch (error) {
    console.error('Failed to cancel invoice:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel invoice';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

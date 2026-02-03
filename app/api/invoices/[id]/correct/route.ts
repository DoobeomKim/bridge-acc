/**
 * 인보이스 정정 API
 * POST /api/invoices/[id]/correct
 */

import { NextResponse } from 'next/server';
import { createCorrectionInvoice } from '@/lib/invoice-actions';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/invoices/[id]/correct
 * 정정 인보이스 생성 (Korrekturrechnung)
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { items, reason } = body;

    // 필수 필드 검증
    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { error: 'Correction reason is required' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one correction item is required' },
        { status: 400 }
      );
    }

    // 정정 인보이스 생성
    const correction = await createCorrectionInvoice(params.id, {
      items,
      reason,
    });

    return NextResponse.json(correction, { status: 201 });
  } catch (error) {
    console.error('Failed to create correction invoice:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to create correction invoice';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

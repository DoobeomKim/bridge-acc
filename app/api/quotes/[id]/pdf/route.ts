/**
 * Quote PDF 생성 API
 * GET /api/quotes/[id]/pdf
 */

import React from 'react';
import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { prisma } from '@/lib/db';
import { QuotePDF } from '@/components/pdf/quote-pdf';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/quotes/[id]/pdf
 * PDF 다운로드
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    // 견적서 조회
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // 설정 조회
    const settings = await prisma.settings.findFirst();

    // PDF 생성
    const pdfBuffer = await renderToBuffer(
      React.createElement(QuotePDF, {
        quote: {
          quoteNumber: quote.quoteNumber,
          validUntil: quote.validUntil.toISOString(),
          subtotal: quote.subtotal,
          totalVat: quote.totalVat,
          totalGross: quote.totalGross,
          notes: quote.notes || undefined,
          terms: quote.terms || undefined,
          createdAt: quote.createdAt.toISOString(),
          customer: {
            customerNumber: quote.customer.customerNumber,
            name: quote.customer.name,
            company: quote.customer.company || undefined,
            address: quote.customer.address || undefined,
            postalCode: quote.customer.postalCode || undefined,
            city: quote.customer.city || undefined,
            country: quote.customer.country,
          },
          items: quote.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            total: item.total,
          })),
        },
        settings: {
          companyName: settings?.companyName || undefined,
          address: settings?.address || undefined,
          taxNumber: settings?.taxNumber || undefined,
          vatId: settings?.vatId || undefined,
        },
      })
    );

    // PDF 반환
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${quote.quoteNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

/**
 * Invoice PDF 생성 API
 * GET /api/invoices/[id]/pdf
 */

import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { prisma } from '@/lib/db';
import { InvoicePDF } from '@/components/pdf/invoice-pdf';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/invoices/[id]/pdf
 * PDF 다운로드
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    // 인보이스 조회
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // 설정 조회
    const settings = await prisma.settings.findFirst();

    // PDF 생성
    const pdfBuffer = await renderToBuffer(
      InvoicePDF({
        invoice: {
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate.toISOString(),
          deliveryDate: invoice.deliveryDate?.toISOString(),
          dueDate: invoice.dueDate.toISOString(),
          paymentTerms: invoice.paymentTerms,
          subtotal: invoice.subtotal,
          totalVat: invoice.totalVat,
          totalGross: invoice.totalGross,
          notes: invoice.notes || undefined,
          terms: invoice.terms || undefined,
          correctionType: invoice.correctionType || undefined,
          customer: {
            customerNumber: invoice.customer.customerNumber,
            name: invoice.customer.name,
            company: invoice.customer.company || undefined,
            address: invoice.customer.address || undefined,
            postalCode: invoice.customer.postalCode || undefined,
            city: invoice.customer.city || undefined,
            country: invoice.customer.country,
          },
          items: invoice.items.map((item) => ({
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
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
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

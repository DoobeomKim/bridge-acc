'use client';

/**
 * 인보이스 상세 페이지
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CancelDialog } from '@/components/invoices/cancel-dialog';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  customer: {
    id: string;
    customerNumber: string;
    name: string;
    company?: string;
    email?: string;
  };
  items: Array<{
    id: string;
    description: string;
    additionalInfo?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    subtotal: number;
    vatAmount: number;
    total: number;
  }>;
  subtotal: number;
  totalVat: number;
  totalGross: number;
  invoiceDate: string;
  deliveryDate?: string;
  dueDate: string;
  paymentTerms: string;
  notes?: string;
  terms?: string;
  paidAt?: string;
  paidAmount: number;
  paymentMethod?: string;
  isLocked: boolean;
  isEditable: boolean;
  isCancelled: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  correctionType?: string;
  createdAt: string;
  quote?: {
    id: string;
    quoteNumber: string;
  };
  corrects?: {
    id: string;
    invoiceNumber: string;
  };
  correctedBy?: {
    id: string;
    invoiceNumber: string;
  };
}

const statusLabels: Record<string, string> = {
  draft: 'Entwurf',
  sent: 'Gesendet',
  paid: 'Bezahlt',
  overdue: 'Überfällig',
  cancelled: 'Storniert',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-orange-100 text-orange-700',
};

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invoices/${params.id}`);

      if (!res.ok) {
        throw new Error('Invoice not found');
      }

      const data = await res.json();
      setInvoice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!confirm('Möchten Sie diese Rechnung senden? Die Rechnung wird danach gesperrt und kann nicht mehr bearbeitet werden.')) {
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'sent' }),
      });

      if (!res.ok) {
        throw new Error('Failed to send invoice');
      }

      fetchInvoice();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invoice');
    }
  };

  const handleMarkAsPaid = async () => {
    if (!confirm('Möchten Sie diese Rechnung als "Bezahlt" markieren?')) {
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'paid',
          paidAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to mark invoice as paid');
      }

      fetchInvoice();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark as paid');
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;

    if (!confirm(`정말 인보이스 "${invoice.invoiceNumber}"를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete invoice');
      }

      router.push('/invoices');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete invoice');
    }
  };

  const handleCancel = async (reason: string) => {
    try {
      const res = await fetch(`/api/invoices/${params.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to cancel invoice');
      }

      const cancellation = await res.json();
      // 취소 인보이스로 리다이렉트
      router.push(`/invoices/${cancellation.id}`);
    } catch (err) {
      throw err; // 다이얼로그에서 처리
    }
  };

  // 연체 확인
  const isOverdue = invoice && invoice.status === 'sent' && new Date(invoice.dueDate) < new Date();
  const displayStatus = isOverdue ? 'overdue' : invoice?.status || '';

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Invoice not found'}
          </div>
          <Link href="/invoices" className="inline-block mt-4 text-blue-600 hover:underline">
            ← 인보이스 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-1">
            <Link href="/invoices" className="hover:underline">
              ← Rechnungen
            </Link>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                    statusColors[displayStatus]
                  }`}
                >
                  {statusLabels[displayStatus]}
                </span>
                {invoice.isLocked && (
                  <span className="text-sm text-gray-600">🔒 Gesperrt</span>
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <a
                href={`/api/invoices/${invoice.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                📄 PDF herunterladen
              </a>
              {invoice.status === 'draft' && (
                <>
                  <button
                    onClick={handleSend}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Senden
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Löschen
                  </button>
                </>
              )}
              {invoice.status === 'sent' && !invoice.isCancelled && (
                <>
                  <button
                    onClick={handleMarkAsPaid}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Als bezahlt markieren
                  </button>
                  <button
                    onClick={() => setShowCancelDialog(true)}
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                  >
                    Stornieren
                  </button>
                </>
              )}
              {(invoice.status === 'paid' || invoice.isCancelled) && !invoice.correctionType && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                  disabled={invoice.isCancelled}
                >
                  {invoice.isCancelled ? 'Storniert' : 'Stornieren'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 연체 경고 */}
        {isOverdue && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            ⚠️ Diese Rechnung ist überfällig! Fälligkeitsdatum:{' '}
            {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
          </div>
        )}

        {/* 취소 알림 */}
        {invoice.isCancelled && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded mb-6">
            <div className="flex items-start gap-2">
              <span>🚫</span>
              <div className="flex-1">
                <strong>Diese Rechnung wurde storniert</strong>
                {invoice.cancelledAt && (
                  <div className="text-sm mt-1">
                    Storniert am: {new Date(invoice.cancelledAt).toLocaleDateString('de-DE')}
                  </div>
                )}
                {invoice.cancellationReason && (
                  <div className="text-sm mt-1">Grund: {invoice.cancellationReason}</div>
                )}
                {invoice.correctedBy && (
                  <div className="text-sm mt-1">
                    Storno-Rechnung:{' '}
                    <Link
                      href={`/invoices/${invoice.correctedBy.id}`}
                      className="underline hover:no-underline"
                    >
                      {invoice.correctedBy.invoiceNumber}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 취소/정정 인보이스 알림 */}
        {invoice.correctionType && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
            <div className="flex items-start gap-2">
              <span>ℹ️</span>
              <div className="flex-1">
                <strong>
                  {invoice.correctionType === 'cancellation'
                    ? 'Dies ist eine Storno-Rechnung'
                    : 'Dies ist eine Korrekturrechnung'}
                </strong>
                {invoice.corrects && (
                  <div className="text-sm mt-1">
                    Bezieht sich auf:{' '}
                    <Link
                      href={`/invoices/${invoice.corrects.id}`}
                      className="underline hover:no-underline"
                    >
                      {invoice.corrects.invoiceNumber}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 고객 정보 */}
        <div className="bg-white border border-gray-200 rounded p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Kunde</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Kundennummer</div>
              <div className="font-medium">{invoice.customer.customerNumber}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Name</div>
              <div className="font-medium">{invoice.customer.name}</div>
            </div>
            {invoice.customer.company && (
              <div>
                <div className="text-sm text-gray-600">Firma</div>
                <div className="font-medium">{invoice.customer.company}</div>
              </div>
            )}
            {invoice.customer.email && (
              <div>
                <div className="text-sm text-gray-600">E-Mail</div>
                <div className="font-medium">{invoice.customer.email}</div>
              </div>
            )}
          </div>
        </div>

        {/* 항목 */}
        <div className="bg-white border border-gray-200 rounded p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Positionen</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-700 uppercase pb-2">
                    Pos.
                  </th>
                  <th className="text-left text-xs font-medium text-gray-700 uppercase pb-2">
                    Beschreibung
                  </th>
                  <th className="text-right text-xs font-medium text-gray-700 uppercase pb-2">
                    Menge
                  </th>
                  <th className="text-right text-xs font-medium text-gray-700 uppercase pb-2">
                    Einzelpreis
                  </th>
                  <th className="text-right text-xs font-medium text-gray-700 uppercase pb-2">
                    MwSt.
                  </th>
                  <th className="text-right text-xs font-medium text-gray-700 uppercase pb-2">
                    Gesamt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="py-3 text-sm">{index + 1}</td>
                    <td className="py-3 text-sm">
                      <div>{item.description}</div>
                      {item.additionalInfo && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          {item.additionalInfo}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-sm text-right">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-3 text-sm text-right">
                      {item.unitPrice.toLocaleString('de-DE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      €
                    </td>
                    <td className="py-3 text-sm text-right">{item.vatRate}%</td>
                    <td className="py-3 text-sm text-right font-medium">
                      {item.total.toLocaleString('de-DE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 합계 */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Nettobetrag:</span>
                  <span className="font-medium">
                    {invoice.subtotal.toLocaleString('de-DE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    €
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>MwSt.:</span>
                  <span className="font-medium">
                    {invoice.totalVat.toLocaleString('de-DE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    €
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Bruttobetrag:</span>
                  <span>
                    {invoice.totalGross.toLocaleString('de-DE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    €
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-600">Rechnungsdatum</dt>
                <dd className="font-medium">
                  {new Date(invoice.invoiceDate).toLocaleDateString('de-DE')}
                </dd>
              </div>
              {invoice.deliveryDate && (
                <div>
                  <dt className="text-sm text-gray-600">Lieferdatum</dt>
                  <dd className="font-medium">
                    {new Date(invoice.deliveryDate).toLocaleDateString('de-DE')}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-600">Fälligkeitsdatum</dt>
                <dd className="font-medium">
                  {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Zahlungsbedingungen</dt>
                <dd className="font-medium">{invoice.paymentTerms}</dd>
              </div>
              {invoice.quote && (
                <div>
                  <dt className="text-sm text-gray-600">Angebot</dt>
                  <dd className="font-medium">
                    <Link
                      href={`/quotes/${invoice.quote.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {invoice.quote.quoteNumber}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-lg font-semibold mb-4">Zahlungsinformationen</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-600">Status</dt>
                <dd className="font-medium">
                  {invoice.status === 'paid' ? '✅ Bezahlt' : '⏳ Ausstehend'}
                </dd>
              </div>
              {invoice.paidAt && (
                <div>
                  <dt className="text-sm text-gray-600">Bezahlt am</dt>
                  <dd className="font-medium">
                    {new Date(invoice.paidAt).toLocaleDateString('de-DE')}
                  </dd>
                </div>
              )}
              {invoice.paidAmount > 0 && (
                <div>
                  <dt className="text-sm text-gray-600">Bezahlter Betrag</dt>
                  <dd className="font-medium">
                    {invoice.paidAmount.toLocaleString('de-DE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    €
                  </dd>
                </div>
              )}
              {invoice.paymentMethod && (
                <div>
                  <dt className="text-sm text-gray-600">Zahlungsmethode</dt>
                  <dd className="font-medium">{invoice.paymentMethod}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* 노트 및 조건 */}
        {(invoice.notes || invoice.terms) && (
          <div className="bg-white border border-gray-200 rounded p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Zusätzliche Informationen</h2>
            {invoice.notes && (
              <div className="mb-4">
                <dt className="text-sm text-gray-600 mb-1">Notizen</dt>
                <dd className="text-sm whitespace-pre-wrap">{invoice.notes}</dd>
              </div>
            )}
            {invoice.terms && (
              <div>
                <dt className="text-sm text-gray-600 mb-1">Bedingungen</dt>
                <dd className="text-sm whitespace-pre-wrap">{invoice.terms}</dd>
              </div>
            )}
          </div>
        )}

        {/* 잠금 경고 */}
        {invoice.isLocked && !invoice.correctionType && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            ℹ️ Diese Rechnung wurde gesendet und ist gesperrt. Sie kann nicht mehr bearbeitet werden. Erstellen Sie stattdessen eine Storno- oder Korrekturrechnung.
          </div>
        )}

        {/* 취소 다이얼로그 */}
        {invoice && (
          <CancelDialog
            isOpen={showCancelDialog}
            onClose={() => setShowCancelDialog(false)}
            onConfirm={handleCancel}
            invoiceNumber={invoice.invoiceNumber}
            totalGross={invoice.totalGross}
          />
        )}
      </div>
    </div>
  );
}

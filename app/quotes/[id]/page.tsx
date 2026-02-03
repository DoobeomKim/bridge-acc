'use client';

/**
 * 견적서 상세 페이지
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  version: number;
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
  validUntil: string;
  notes?: string;
  terms?: string;
  sentAt?: string;
  acceptedAt?: string;
  isEditable: boolean;
  createdAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
  };
}

const statusLabels: Record<string, string> = {
  draft: 'Entwurf',
  sent: 'Gesendet',
  accepted: 'Angenommen',
  rejected: 'Abgelehnt',
  expired: 'Abgelaufen',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-orange-100 text-orange-700',
};

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuote();
  }, [params.id]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quotes/${params.id}`);

      if (!res.ok) {
        throw new Error('Quote not found');
      }

      const data = await res.json();
      setQuote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!confirm('Möchten Sie dieses Angebot als "Gesendet" markieren?')) {
      return;
    }

    try {
      const res = await fetch(`/api/quotes/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'sent' }),
      });

      if (!res.ok) {
        throw new Error('Failed to send quote');
      }

      fetchQuote();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send quote');
    }
  };

  const handleAccept = async () => {
    if (!confirm('Möchten Sie dieses Angebot als "Angenommen" markieren?')) {
      return;
    }

    try {
      const res = await fetch(`/api/quotes/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' }),
      });

      if (!res.ok) {
        throw new Error('Failed to accept quote');
      }

      fetchQuote();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to accept quote');
    }
  };

  const handleReject = async () => {
    if (!confirm('Möchten Sie dieses Angebot als "Abgelehnt" markieren?')) {
      return;
    }

    try {
      const res = await fetch(`/api/quotes/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (!res.ok) {
        throw new Error('Failed to reject quote');
      }

      fetchQuote();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject quote');
    }
  };

  const handleConvertToInvoice = async () => {
    if (!confirm('Möchten Sie dieses Angebot in eine Rechnung umwandeln?')) {
      return;
    }

    try {
      const res = await fetch(`/api/quotes/${params.id}/convert`, {
        method: 'POST',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to convert quote to invoice');
      }

      const invoice = await res.json();
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to convert to invoice');
    }
  };

  const handleDelete = async () => {
    if (!quote) return;

    if (!confirm(`정말 견적서 "${quote.quoteNumber}"를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/quotes/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete quote');
      }

      router.push('/quotes');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete quote');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Quote not found'}
          </div>
          <Link href="/quotes" className="inline-block mt-4 text-blue-600 hover:underline">
            ← 견적서 목록으로
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
            <Link href="/quotes" className="hover:underline">
              ← Angebote
            </Link>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{quote.quoteNumber}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                    statusColors[quote.status]
                  }`}
                >
                  {statusLabels[quote.status]}
                </span>
                {quote.version > 1 && (
                  <span className="text-sm text-gray-600">Version {quote.version}</span>
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <a
                href={`/api/quotes/${quote.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                📄 PDF herunterladen
              </a>
              {quote.status === 'draft' && (
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
              {quote.status === 'sent' && (
                <>
                  <button
                    onClick={handleAccept}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Annehmen
                  </button>
                  <button
                    onClick={handleReject}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Ablehnen
                  </button>
                </>
              )}
              {quote.status === 'accepted' && !quote.invoice && (
                <button
                  onClick={handleConvertToInvoice}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  📄 In Rechnung umwandeln
                </button>
              )}
              {quote.invoice && (
                <Link
                  href={`/invoices/${quote.invoice.id}`}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  ✅ Rechnung anzeigen: {quote.invoice.invoiceNumber}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 고객 정보 */}
        <div className="bg-white border border-gray-200 rounded p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Kunde</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Kundennummer</div>
              <div className="font-medium">{quote.customer.customerNumber}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Name</div>
              <div className="font-medium">{quote.customer.name}</div>
            </div>
            {quote.customer.company && (
              <div>
                <div className="text-sm text-gray-600">Firma</div>
                <div className="font-medium">{quote.customer.company}</div>
              </div>
            )}
            {quote.customer.email && (
              <div>
                <div className="text-sm text-gray-600">E-Mail</div>
                <div className="font-medium">{quote.customer.email}</div>
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
                {quote.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="py-3 text-sm">{index + 1}</td>
                    <td className="py-3 text-sm">{item.description}</td>
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
                    {quote.subtotal.toLocaleString('de-DE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    €
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>MwSt.:</span>
                  <span className="font-medium">
                    {quote.totalVat.toLocaleString('de-DE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    €
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Bruttobetrag:</span>
                  <span>
                    {quote.totalGross.toLocaleString('de-DE', {
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
                <dt className="text-sm text-gray-600">Gültig bis</dt>
                <dd className="font-medium">
                  {new Date(quote.validUntil).toLocaleDateString('de-DE')}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Erstellt am</dt>
                <dd className="font-medium">
                  {new Date(quote.createdAt).toLocaleDateString('de-DE')}
                </dd>
              </div>
              {quote.sentAt && (
                <div>
                  <dt className="text-sm text-gray-600">Gesendet am</dt>
                  <dd className="font-medium">
                    {new Date(quote.sentAt).toLocaleDateString('de-DE')}
                  </dd>
                </div>
              )}
              {quote.acceptedAt && (
                <div>
                  <dt className="text-sm text-gray-600">Angenommen am</dt>
                  <dd className="font-medium">
                    {new Date(quote.acceptedAt).toLocaleDateString('de-DE')}
                  </dd>
                </div>
              )}
              {quote.invoice && (
                <div>
                  <dt className="text-sm text-gray-600">Rechnung</dt>
                  <dd className="font-medium">
                    <Link
                      href={`/invoices/${quote.invoice.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {quote.invoice.invoiceNumber}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {(quote.notes || quote.terms) && (
            <div className="bg-white border border-gray-200 rounded p-6">
              <h2 className="text-lg font-semibold mb-4">Zusätzliche Informationen</h2>
              {quote.notes && (
                <div className="mb-4">
                  <dt className="text-sm text-gray-600 mb-1">Notizen</dt>
                  <dd className="text-sm whitespace-pre-wrap">{quote.notes}</dd>
                </div>
              )}
              {quote.terms && (
                <div>
                  <dt className="text-sm text-gray-600 mb-1">Bedingungen</dt>
                  <dd className="text-sm whitespace-pre-wrap">{quote.terms}</dd>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 편집 불가 경고 */}
        {!quote.isEditable && quote.status === 'sent' && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            ℹ️ Dieses Angebot wurde gesendet und kann nicht mehr bearbeitet werden.
          </div>
        )}
      </div>
    </div>
  );
}

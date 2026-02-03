'use client';

/**
 * 인보이스 목록 페이지
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  customer: {
    name: string;
    company?: string;
  };
  subtotal: number;
  totalVat: number;
  totalGross: number;
  invoiceDate: string;
  dueDate: string;
  createdAt: string;
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invoices');

      if (!res.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`정말 인보이스 "${invoiceNumber}"를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete invoice');
      }

      fetchInvoices();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete invoice');
    }
  };

  // 연체 상태 판단
  const getInvoiceStatus = (invoice: Invoice) => {
    if (invoice.status === 'sent' && new Date(invoice.dueDate) < new Date()) {
      return 'overdue';
    }
    return invoice.status;
  };

  const filteredInvoices = filter === 'all'
    ? invoices
    : invoices.filter((inv) => getInvoiceStatus(inv) === filter);

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Rechnungen</h1>
            <p className="text-gray-600 mt-1">인보이스 관리</p>
          </div>
          <Link
            href="/invoices/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Neue Rechnung
          </Link>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Alle ({invoices.length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded ${
              filter === 'draft'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Entwurf ({invoices.filter((inv) => inv.status === 'draft').length})
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-4 py-2 rounded ${
              filter === 'sent'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Gesendet ({invoices.filter((inv) => inv.status === 'sent' && new Date(inv.dueDate) >= new Date()).length})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded ${
              filter === 'paid'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Bezahlt ({invoices.filter((inv) => inv.status === 'paid').length})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded ${
              filter === 'overdue'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Überfällig ({invoices.filter((inv) => getInvoiceStatus(inv) === 'overdue').length})
          </button>
        </div>

        {/* 인보이스 목록 */}
        {filteredInvoices.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded p-8 text-center">
            <p className="text-gray-600">
              {filter === 'all'
                ? '아직 등록된 인보이스가 없습니다.'
                : `"${statusLabels[filter]}" 상태의 인보이스가 없습니다.`}
            </p>
            {filter === 'all' && (
              <Link
                href="/invoices/new"
                className="inline-block mt-4 text-blue-600 hover:underline"
              >
                첫 번째 인보이스 작성하기
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Rechnungsnummer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Kunde
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    Betrag (Brutto)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Datum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Fällig am
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => {
                  const displayStatus = getInvoiceStatus(invoice);
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">
                        <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{invoice.customer.name}</div>
                        {invoice.customer.company && (
                          <div className="text-xs text-gray-500">{invoice.customer.company}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            statusColors[displayStatus]
                          }`}
                        >
                          {statusLabels[displayStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {invoice.totalGross.toLocaleString('de-DE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        €
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(invoice.invoiceDate).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right space-x-2">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          보기
                        </Link>
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => handleDelete(invoice.id, invoice.invoiceNumber)}
                            className="text-red-600 hover:underline"
                          >
                            삭제
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 통계 */}
        <div className="mt-6 text-sm text-gray-600">
          총 {filteredInvoices.length}개의 인보이스
          {filter !== 'all' && ` (전체: ${invoices.length}개)`}
        </div>
      </div>
    </div>
  );
}

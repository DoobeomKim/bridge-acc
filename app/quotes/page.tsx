'use client';

/**
 * 견적서 목록 페이지
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  customer: {
    name: string;
    company?: string;
  };
  subtotal: number;
  totalVat: number;
  totalGross: number;
  validUntil: string;
  createdAt: string;
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

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quotes');

      if (!res.ok) {
        throw new Error('Failed to fetch quotes');
      }

      const data = await res.json();
      setQuotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, quoteNumber: string) => {
    if (!confirm(`정말 견적서 "${quoteNumber}"를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete quote');
      }

      fetchQuotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete quote');
    }
  };

  const filteredQuotes = filter === 'all'
    ? quotes
    : quotes.filter((q) => q.status === filter);

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
            <h1 className="text-3xl font-bold">Angebote</h1>
            <p className="text-gray-600 mt-1">견적서 관리</p>
          </div>
          <Link
            href="/quotes/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Neues Angebot
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
            Alle ({quotes.length})
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded ${
              filter === 'draft'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Entwurf ({quotes.filter((q) => q.status === 'draft').length})
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-4 py-2 rounded ${
              filter === 'sent'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Gesendet ({quotes.filter((q) => q.status === 'sent').length})
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-4 py-2 rounded ${
              filter === 'accepted'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Angenommen ({quotes.filter((q) => q.status === 'accepted').length})
          </button>
        </div>

        {/* 견적서 목록 */}
        {filteredQuotes.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded p-8 text-center">
            <p className="text-gray-600">
              {filter === 'all'
                ? '아직 등록된 견적서가 없습니다.'
                : `"${statusLabels[filter]}" 상태의 견적서가 없습니다.`}
            </p>
            {filter === 'all' && (
              <Link
                href="/quotes/new"
                className="inline-block mt-4 text-blue-600 hover:underline"
              >
                첫 번째 견적서 작성하기
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Angebotsnummer
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
                    Gültig bis
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      <Link href={`/quotes/${quote.id}`} className="hover:underline">
                        {quote.quoteNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{quote.customer.name}</div>
                      {quote.customer.company && (
                        <div className="text-xs text-gray-500">{quote.customer.company}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          statusColors[quote.status]
                        }`}
                      >
                        {statusLabels[quote.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {quote.totalGross.toLocaleString('de-DE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      €
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(quote.validUntil).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-4 py-3 text-sm text-right space-x-2">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        보기
                      </Link>
                      {quote.status === 'draft' && (
                        <button
                          onClick={() => handleDelete(quote.id, quote.quoteNumber)}
                          className="text-red-600 hover:underline"
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 통계 */}
        <div className="mt-6 text-sm text-gray-600">
          총 {filteredQuotes.length}개의 견적서
          {filter !== 'all' && ` (전체: ${quotes.length}개)`}
        </div>
      </div>
    </div>
  );
}

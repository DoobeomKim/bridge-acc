'use client';

/**
 * 고객 목록 페이지
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  email?: string;
  company?: string;
  city?: string;
  _count?: {
    quotes: number;
    invoices: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');

      if (!res.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`정말 "${name}" 고객을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete customer');
      }

      fetchCustomers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete customer');
    }
  };

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
            <h1 className="text-3xl font-bold">Kunden</h1>
            <p className="text-gray-600 mt-1">
              고객 관리
            </p>
          </div>
          <Link
            href="/customers/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Neuer Kunde
          </Link>
        </div>

        {/* 고객 목록 */}
        {customers.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded p-8 text-center">
            <p className="text-gray-600">아직 등록된 고객이 없습니다.</p>
            <Link
              href="/customers/new"
              className="inline-block mt-4 text-blue-600 hover:underline"
            >
              첫 번째 고객 추가하기
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Kundennummer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Firma
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    E-Mail
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Stadt
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                    Angebote
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                    Rechnungen
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {customer.customerNumber}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {customer.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.company || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.city || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {customer._count?.quotes || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {customer._count?.invoices || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-right space-x-2">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        보기
                      </Link>
                      <button
                        onClick={() => handleDelete(customer.id, customer.name)}
                        className="text-red-600 hover:underline"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 통계 */}
        <div className="mt-6 text-sm text-gray-600">
          총 {customers.length}명의 고객
        </div>
      </div>
    </div>
  );
}

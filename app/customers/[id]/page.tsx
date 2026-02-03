'use client';

/**
 * 고객 상세 페이지
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  email?: string;
  company?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country: string;
  vatId?: string;
  taxExempt: boolean;
  quotes?: any[];
  invoices?: any[];
  createdAt: string;
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});

  useEffect(() => {
    fetchCustomer();
  }, [params.id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers/${params.id}`);

      if (!res.ok) {
        throw new Error('Customer not found');
      }

      const data = await res.json();
      setCustomer(data);
      setFormData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/customers/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to update customer');
      }

      const updated = await res.json();
      setCustomer(updated);
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update customer');
    }
  };

  const handleDelete = async () => {
    if (!customer) return;

    if (!confirm(`정말 "${customer.name}" 고객을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete customer');
      }

      router.push('/customers');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete customer');
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

  if (error || !customer) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Customer not found'}
          </div>
          <Link href="/customers" className="inline-block mt-4 text-blue-600 hover:underline">
            ← 고객 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">
              <Link href="/customers" className="hover:underline">
                ← Kunden
              </Link>
            </div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-gray-600 mt-1">
              {customer.customerNumber}
            </p>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Löschen
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData(customer);
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                Abbrechen
              </button>
            )}
          </div>
        </div>

        {/* 정보 표시 / 편집 */}
        {editing ? (
          <form onSubmit={handleUpdate} className="bg-white border border-gray-200 rounded p-6 space-y-6">
            {/* 편집 폼 (간단 버전) */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firma</label>
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Speichern
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white border border-gray-200 rounded p-6">
              <h2 className="text-lg font-semibold mb-4">Kontaktdaten</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-600">Name</dt>
                  <dd className="font-medium">{customer.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Firma</dt>
                  <dd className="font-medium">{customer.company || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">E-Mail</dt>
                  <dd className="font-medium">{customer.email || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Stadt</dt>
                  <dd className="font-medium">{customer.city || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">USt-IdNr.</dt>
                  <dd className="font-medium">{customer.vatId || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Steuerbefreit</dt>
                  <dd className="font-medium">{customer.taxExempt ? 'Ja' : 'Nein'}</dd>
                </div>
              </dl>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded p-6">
                <h3 className="text-sm text-gray-600 mb-2">Angebote</h3>
                <p className="text-3xl font-bold">{customer.quotes?.length || 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded p-6">
                <h3 className="text-sm text-gray-600 mb-2">Rechnungen</h3>
                <p className="text-3xl font-bold">{customer.invoices?.length || 0}</p>
              </div>
            </div>

            {/* 최근 견적서 */}
            {customer.quotes && customer.quotes.length > 0 && (
              <div className="bg-white border border-gray-200 rounded p-6">
                <h2 className="text-lg font-semibold mb-4">Letzte Angebote</h2>
                <div className="space-y-2">
                  {customer.quotes.slice(0, 5).map((quote: any) => (
                    <div key={quote.id} className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">{quote.quoteNumber}</span>
                      <span className="text-sm text-gray-600">{quote.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 최근 인보이스 */}
            {customer.invoices && customer.invoices.length > 0 && (
              <div className="bg-white border border-gray-200 rounded p-6">
                <h2 className="text-lg font-semibold mb-4">Letzte Rechnungen</h2>
                <div className="space-y-2">
                  {customer.invoices.slice(0, 5).map((invoice: any) => (
                    <div key={invoice.id} className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">{invoice.invoiceNumber}</span>
                      <span className="text-sm text-gray-600">{invoice.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

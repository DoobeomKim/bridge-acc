'use client';

/**
 * 고객 생성 페이지
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'DE',
    vatId: '',
    taxExempt: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create customer');
      }

      const customer = await res.json();
      router.push(`/customers/${customer.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Neuer Kunde</h1>
          <p className="text-gray-600 mt-1">
            새 고객 추가
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded p-6 space-y-6">
          {/* 기본 정보 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Grunddaten</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Max Mustermann"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firma
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Mustermann GmbH"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="max@example.com"
                />
              </div>
            </div>
          </div>

          {/* 주소 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Adresse</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Straße und Hausnummer
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Hauptstraße 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postleitzahl
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="10115"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stadt
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Berlin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Land
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="DE">Deutschland</option>
                  <option value="AT">Österreich</option>
                  <option value="CH">Schweiz</option>
                  <option value="FR">Frankreich</option>
                  <option value="NL">Niederlande</option>
                </select>
              </div>
            </div>
          </div>

          {/* 세금 정보 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Steuerinformationen</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  USt-IdNr. (EU B2B)
                </label>
                <input
                  type="text"
                  name="vatId"
                  value={formData.vatId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="DE123456789"
                />
                <p className="text-xs text-gray-500 mt-1">
                  EU 내 B2B 거래 시 필요 (역과세)
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="taxExempt"
                  checked={formData.taxExempt}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  Steuerbefreit (면세 고객)
                </label>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Speichern...' : 'Kunde anlegen'}
            </button>
            <Link
              href="/customers"
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-center"
            >
              Abbrechen
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

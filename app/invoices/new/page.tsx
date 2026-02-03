'use client';

/**
 * 인보이스 생성 페이지
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AIAdvisorDialog } from '@/components/quotes/ai-advisor-dialog';

interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  company?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '',
    invoiceDate: '',
    deliveryDate: '',
    dueDate: '',
    paymentTerms: '14 Tage netto',
    notes: '',
    terms: 'Zahlbar innerhalb von 14 Tagen ohne Abzug.\nBitte überweisen Sie den Betrag auf unser Konto.',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      description: '',
      quantity: 1,
      unit: 'Stück',
      unitPrice: 0,
      vatRate: 19,
    },
  ]);

  useEffect(() => {
    fetchCustomers();

    // 기본 날짜 설정
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 14);

    setFormData((prev) => ({
      ...prev,
      invoiceDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
    }));
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        description: '',
        quantity: 1,
        unit: 'Stück',
        unitPrice: 0,
        vatRate: 19,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const vatAmount = subtotal * (item.vatRate / 100);
    return subtotal + vatAmount;
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalVat = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice * (item.vatRate / 100),
      0
    );
    const totalGross = subtotal + totalVat;

    return { subtotal, totalVat, totalGross };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 유효성 검사
      if (!formData.customerId) {
        throw new Error('Bitte wählen Sie einen Kunden aus');
      }

      if (items.length === 0 || !items[0].description) {
        throw new Error('Bitte fügen Sie mindestens eine Position hinzu');
      }

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          deliveryDate: formData.deliveryDate || null,
          items,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create invoice');
      }

      const invoice = await res.json();
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">Neue Rechnung</h1>
              <p className="text-gray-600 mt-1">새 인보이스 작성</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAIDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium shadow-lg flex items-center gap-2"
            >
              <span className="text-xl">🤖</span>
              <span>AI Preisberatung</span>
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-lg font-semibold mb-4">Grunddaten</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kunde <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) =>
                    setFormData({ ...formData, customerId: e.target.value })
                  }
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Kunde auswählen...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customerNumber} - {customer.name}
                      {customer.company && ` (${customer.company})`}
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    <Link href="/customers/new" className="text-blue-600 hover:underline">
                      먼저 고객을 추가하세요
                    </Link>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rechnungsdatum <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => {
                    const invoiceDate = new Date(e.target.value);
                    const dueDate = new Date(invoiceDate);
                    dueDate.setDate(dueDate.getDate() + 14);

                    setFormData({
                      ...formData,
                      invoiceDate: e.target.value,
                      dueDate: dueDate.toISOString().split('T')[0],
                    });
                  }}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lieferdatum
                </label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fälligkeitsdatum <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zahlungsbedingungen
                </label>
                <input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentTerms: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="z.B. 14 Tage netto"
                />
              </div>
            </div>
          </div>

          {/* 항목 */}
          <div className="bg-white border border-gray-200 rounded p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Positionen</h2>
              <button
                type="button"
                onClick={addItem}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                + Position hinzufügen
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium">Position {index + 1}</h3>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 text-sm hover:underline"
                      >
                        Entfernen
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Beschreibung
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, 'description', e.target.value)
                        }
                        required
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="z.B. Webentwicklung, Beratung, etc."
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Menge
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, 'quantity', parseFloat(e.target.value))
                        }
                        min="0.01"
                        step="0.01"
                        required
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Einheit
                      </label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      >
                        <option value="Stück">Stück</option>
                        <option value="Stunden">Stunden</option>
                        <option value="Tage">Tage</option>
                        <option value="Pauschal">Pauschal</option>
                      </select>
                    </div>

                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Einzelpreis (€)
                      </label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(index, 'unitPrice', parseFloat(e.target.value))
                        }
                        min="0"
                        step="0.01"
                        required
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        MwSt. (%)
                      </label>
                      <select
                        value={item.vatRate}
                        onChange={(e) =>
                          updateItem(index, 'vatRate', parseFloat(e.target.value))
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      >
                        <option value="19">19%</option>
                        <option value="7">7%</option>
                        <option value="0">0%</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Gesamt
                      </label>
                      <div className="px-3 py-2 bg-gray-50 rounded text-sm font-medium">
                        {calculateItemTotal(item).toLocaleString('de-DE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        €
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 합계 */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Nettobetrag:</span>
                    <span className="font-medium">
                      {totals.subtotal.toLocaleString('de-DE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>MwSt.:</span>
                    <span className="font-medium">
                      {totals.totalVat.toLocaleString('de-DE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      €
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Bruttobetrag:</span>
                    <span>
                      {totals.totalGross.toLocaleString('de-DE', {
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
          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-lg font-semibold mb-4">Zusätzliche Informationen</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Interne Notizen (nicht sichtbar für Kunden)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bedingungen
                </label>
                <textarea
                  value={formData.terms}
                  onChange={(e) =>
                    setFormData({ ...formData, terms: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Zahlungsbedingungen, AGBs, etc."
                />
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? 'Erstellen...' : 'Rechnung erstellen'}
            </button>
            <Link
              href="/invoices"
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded hover:bg-gray-300 text-center font-medium"
            >
              Abbrechen
            </Link>
          </div>
        </form>

        {/* AI 컨설팅 다이얼로그 */}
        <AIAdvisorDialog
          isOpen={showAIDialog}
          onClose={() => setShowAIDialog(false)}
          onApply={(aiItems) => {
            setItems(aiItems);
            setShowAIDialog(false);
          }}
        />
      </div>
    </div>
  );
}

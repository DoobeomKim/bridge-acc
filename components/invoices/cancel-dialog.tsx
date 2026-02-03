'use client';

/**
 * 인보이스 취소 다이얼로그
 */

import { useState } from 'react';

interface CancelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  invoiceNumber: string;
  totalGross: number;
}

export function CancelDialog({
  isOpen,
  onClose,
  onConfirm,
  invoiceNumber,
  totalGross,
}: CancelDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invoice');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Rechnung stornieren</h2>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Achtung:</strong> Diese Aktion erstellt eine Storno-Rechnung mit negativen
            Beträgen. Die Originalrechnung bleibt unveränderlich (deutsches Steuerrecht).
          </p>
        </div>

        <div className="bg-gray-50 rounded p-4 mb-4">
          <div className="text-sm text-gray-600 mb-1">Rechnung</div>
          <div className="font-bold text-lg">{invoiceNumber}</div>
          <div className="text-sm text-gray-600 mt-2">Betrag (Brutto)</div>
          <div className="font-bold text-lg">
            {totalGross.toLocaleString('de-DE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            €
          </div>
          <div className="text-sm text-red-600 mt-2">
            → Storno-Betrag:{' '}
            <span className="font-bold">
              {(-totalGross).toLocaleString('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              €
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grund der Stornierung <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="z.B. Kunde hat storniert, Fehlerhafte Rechnung, etc."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              {loading ? 'Storniere...' : 'Stornieren'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

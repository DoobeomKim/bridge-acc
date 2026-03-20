'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils-accounting'

interface CancelDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
  invoiceNumber: string
  totalGross: number
}

export function CancelDialog({
  isOpen,
  onClose,
  onConfirm,
  invoiceNumber,
  totalGross,
}: CancelDialogProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onConfirm(reason)
      setReason('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invoice')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-zinc-200 max-w-md w-full shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-zinc-900">Rechnung stornieren</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Warning */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-800">
              <strong>Achtung:</strong> Diese Aktion erstellt eine Storno-Rechnung mit negativen
              Beträgen. Die Originalrechnung bleibt unveränderlich (deutsches Steuerrecht).
            </p>
          </div>

          {/* Invoice info */}
          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">인보이스</p>
              <p className="text-sm font-semibold font-mono text-zinc-900">{invoiceNumber}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-200">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Betrag (Brutto)</p>
                <p className="text-sm font-semibold tabular-nums text-zinc-900">{formatCurrency(totalGross, 'EUR')}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Storno-Betrag</p>
                <p className="text-sm font-semibold tabular-nums text-red-600">{formatCurrency(-totalGross, 'EUR')}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                취소 사유 <span className="text-red-400">*</span>
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                placeholder="z.B. Kunde hat storniert, Fehlerhafte Rechnung, etc."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !reason.trim()}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Storniere...' : 'Stornieren'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 text-sm font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 disabled:opacity-50 transition-all"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

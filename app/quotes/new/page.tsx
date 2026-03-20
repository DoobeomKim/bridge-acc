'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { AIAdvisorDialog } from '@/components/quotes/ai-advisor-dialog'
import { formatCurrency } from '@/lib/utils-accounting'

interface Customer {
  id: string
  customerNumber: string
  name: string
  company?: string
}

interface QuoteItem {
  description: string
  additionalInfo?: string
  quantity: number
  unit: string
  unitPrice: number
  vatRate: number
}

const selectClass = 'h-8 text-xs border border-zinc-200 rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 w-full'
const inputClass = 'h-8 text-xs border-zinc-200 focus-visible:ring-zinc-900'
const labelClass = 'text-[10px] font-semibold uppercase tracking-widest text-zinc-400'

export default function NewQuotePage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAIDialog, setShowAIDialog] = useState(false)

  const [formData, setFormData] = useState({
    customerId: '',
    validUntil: '',
    notes: '',
    terms: 'Zahlungsziel: 14 Tage netto\nAngebot gültig für 30 Tage',
  })

  const [items, setItems] = useState<QuoteItem[]>([
    { description: '', additionalInfo: '', quantity: 1, unit: 'Stück', unitPrice: 0, vatRate: 19 },
  ])

  useEffect(() => {
    fetchCustomers()
    const d = new Date()
    d.setDate(d.getDate() + 30)
    setFormData((prev) => ({ ...prev, validUntil: d.toISOString().split('T')[0] }))
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers')
      if (res.ok) setCustomers(await res.json())
    } catch (err) { console.error(err) }
  }

  const addItem = () => setItems([...items, { description: '', additionalInfo: '', quantity: 1, unit: 'Stück', unitPrice: 0, vatRate: 19 }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateItem = (i: number, field: keyof QuoteItem, value: any) => {
    const next = [...items]
    next[i] = { ...next[i], [field]: value }
    setItems(next)
  }

  const itemTotal = (item: QuoteItem) => item.quantity * item.unitPrice * (1 + item.vatRate / 100)
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const totalVat = items.reduce((s, i) => s + i.quantity * i.unitPrice * (i.vatRate / 100), 0)
  const totalGross = subtotal + totalVat

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customerId) { setError('고객을 선택해 주세요'); return }
    if (!items[0]?.description) { setError('항목을 하나 이상 추가해 주세요'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, items }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      const quote = await res.json()
      router.push(`/quotes/${quote.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Link href="/quotes" className="mt-0.5 p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">새 견적서</h1>
              <p className="text-sm text-zinc-500 mt-0.5">견적서 작성</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAIDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI 가격 상담
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 기본 정보 */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">기본 정보</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className={labelClass}>고객 <span className="text-red-400">*</span></p>
                  <select value={formData.customerId} onChange={(e) => setFormData({ ...formData, customerId: e.target.value })} required className={selectClass}>
                    <option value="">고객 선택...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.customerNumber} - {c.name}{c.company && ` (${c.company})`}</option>
                    ))}
                  </select>
                  {customers.length === 0 && (
                    <Link href="/customers/new" className="text-[11px] text-zinc-400 hover:text-zinc-900 transition-colors">먼저 고객을 추가하세요 →</Link>
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className={labelClass}>유효기간 <span className="text-red-400">*</span></p>
                  <Input type="date" value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} required className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* 항목 */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">항목</h2>
              <button type="button" onClick={addItem} className="flex items-center gap-1 px-3 h-7 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all">
                <Plus className="w-3 h-3" /> 항목 추가
              </button>
            </div>
            <div className="divide-y divide-zinc-50">
              {items.map((item, idx) => (
                <div key={idx} className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={labelClass}>항목 {idx + 1}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} required placeholder="설명 (예: 웹 개발, 컨설팅...)" className={inputClass} />
                    <Input value={item.additionalInfo || ''} onChange={(e) => updateItem(idx, 'additionalInfo', e.target.value)} placeholder="추가 정보 (선택)" className={`${inputClass} text-zinc-400`} />
                  </div>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-3 space-y-1">
                      <p className={labelClass}>수량</p>
                      <Input type="number" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value))} min="0.01" step="0.01" required className={inputClass} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className={labelClass}>단위</p>
                      <select value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} className={selectClass}>
                        <option value="Stück">Stück</option>
                        <option value="Stunden">Stunden</option>
                        <option value="Tage">Tage</option>
                        <option value="Pauschal">Pauschal</option>
                      </select>
                    </div>
                    <div className="col-span-3 space-y-1">
                      <p className={labelClass}>단가 (€)</p>
                      <Input type="number" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value))} min="0" step="0.01" required className={inputClass} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className={labelClass}>VAT</p>
                      <select value={item.vatRate} onChange={(e) => updateItem(idx, 'vatRate', parseFloat(e.target.value))} className={selectClass}>
                        <option value="19">19%</option>
                        <option value="7">7%</option>
                        <option value="0">0%</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className={labelClass}>합계</p>
                      <div className="h-8 flex items-center px-3 bg-zinc-50 border border-zinc-200 rounded-md text-xs font-semibold tabular-nums text-zinc-800">
                        {itemTotal(item).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* 합계 */}
            <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50/50">
              <div className="flex justify-end">
                <div className="w-60 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-500">소계 (Net)</span>
                    <span className="text-xs tabular-nums text-zinc-700">{formatCurrency(subtotal, 'EUR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-500">VAT</span>
                    <span className="text-xs tabular-nums text-amber-600">{formatCurrency(totalVat, 'EUR')}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-zinc-200">
                    <span className="text-xs font-semibold text-zinc-900">총액 (Brutto)</span>
                    <span className="text-sm font-semibold tabular-nums text-zinc-900">{formatCurrency(totalGross, 'EUR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">추가 정보</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <p className={labelClass}>메모 (내부용)</p>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="고객에게 보이지 않는 내부 메모" className="w-full text-xs border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none" />
              </div>
              <div className="space-y-1.5">
                <p className={labelClass}>조건</p>
                <textarea value={formData.terms} onChange={(e) => setFormData({ ...formData, terms: e.target.value })} rows={3} placeholder="결제 조건, 배송 조건 등" className="w-full text-xs border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors">
              {loading ? '생성 중...' : '견적서 생성'}
            </button>
            <Link href="/quotes" className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 text-sm font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all text-center">
              취소
            </Link>
          </div>
        </form>

        <AIAdvisorDialog isOpen={showAIDialog} onClose={() => setShowAIDialog(false)} onApply={(aiItems) => { setItems(aiItems); setShowAIDialog(false) }} />

      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileDown, Send, Check, XCircle, Trash2, AlertCircle, Info, Pencil, Plus, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils-accounting'
import { CancelDialog } from '@/components/invoices/cancel-dialog'

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  customer: {
    id: string
    customerNumber: string
    name: string
    company?: string
    email?: string
  }
  items: Array<{
    id: string
    description: string
    additionalInfo?: string
    quantity: number
    unit: string
    unitPrice: number
    vatRate: number
    subtotal: number
    vatAmount: number
    total: number
  }>
  subtotal: number
  totalVat: number
  totalGross: number
  invoiceDate: string
  deliveryDate?: string
  dueDate: string
  paymentTerms: string
  notes?: string
  terms?: string
  paidAt?: string
  paidAmount: number
  paymentMethod?: string
  isLocked: boolean
  isEditable: boolean
  isCancelled: boolean
  cancelledAt?: string
  cancellationReason?: string
  correctionType?: string
  createdAt: string
  quote?: { id: string; quoteNumber: string }
  corrects?: { id: string; invoiceNumber: string }
  correctedBy?: { id: string; invoiceNumber: string }
}

interface EditItem {
  description: string
  additionalInfo: string
  quantity: number
  unit: string
  unitPrice: number
  vatRate: number
}

interface EditForm {
  invoiceNumber: string
  invoiceDate: string
  deliveryDate: string
  dueDate: string
  paymentTerms: string
  notes: string
  terms: string
  items: EditItem[]
}

const STATUS_LABELS: Record<string, string> = {
  draft: '초안', sent: '발송됨', paid: '결제됨', overdue: '연체', cancelled: '취소됨',
}
const STATUS_STYLES: Record<string, string> = {
  draft:    'bg-zinc-100 text-zinc-500 border-zinc-200',
  sent:     'bg-amber-50 text-amber-700 border-amber-200',
  paid:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue:  'bg-red-50 text-red-600 border-red-200',
  cancelled:'bg-zinc-100 text-zinc-400 border-zinc-200',
}
const labelClass = 'text-[10px] font-semibold uppercase tracking-widest text-zinc-400'
const inputClass = 'w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-800 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200'

function toDateInput(dateStr: string | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

function calcItemTotal(item: EditItem) {
  const subtotal = item.quantity * item.unitPrice
  const vatAmount = subtotal * (item.vatRate / 100)
  return subtotal + vatAmount
}

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)

  useEffect(() => { fetchInvoice() }, [params.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/invoices/${params.id}`)
      if (!res.ok) throw new Error('Invoice not found')
      setInvoice(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (inv: Invoice) => {
    setEditForm({
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: toDateInput(inv.invoiceDate),
      deliveryDate: toDateInput(inv.deliveryDate),
      dueDate: toDateInput(inv.dueDate),
      paymentTerms: inv.paymentTerms,
      notes: inv.notes || '',
      terms: inv.terms || '',
      items: inv.items.map(item => ({
        description: item.description,
        additionalInfo: item.additionalInfo || '',
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
      })),
    })
    setEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editForm) return
    setSaving(true)
    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: editForm.invoiceNumber,
          invoiceDate: editForm.invoiceDate,
          deliveryDate: editForm.deliveryDate || null,
          dueDate: editForm.dueDate,
          paymentTerms: editForm.paymentTerms,
          notes: editForm.notes || null,
          terms: editForm.terms || null,
          items: editForm.items.map(item => ({
            description: item.description,
            additionalInfo: item.additionalInfo || null,
            quantity: Number(item.quantity),
            unit: item.unit,
            unitPrice: Number(item.unitPrice),
            vatRate: Number(item.vatRate),
          })),
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      await fetchInvoice()
      setEditing(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const updateItem = (idx: number, field: keyof EditItem, value: string | number) => {
    if (!editForm) return
    const items = [...editForm.items]
    items[idx] = { ...items[idx], [field]: value }
    setEditForm({ ...editForm, items })
  }

  const addItem = () => {
    if (!editForm) return
    setEditForm({
      ...editForm,
      items: [...editForm.items, { description: '', additionalInfo: '', quantity: 1, unit: 'Stück', unitPrice: 0, vatRate: 19 }],
    })
  }

  const removeItem = (idx: number) => {
    if (!editForm) return
    setEditForm({ ...editForm, items: editForm.items.filter((_, i) => i !== idx) })
  }

  const handleSend = async () => {
    if (!confirm('발송하면 인보이스가 잠기고 수정할 수 없습니다. 발송하시겠습니까?')) return
    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      })
      if (!res.ok) throw new Error('Failed to send invoice')
      fetchInvoice()
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
  }

  const handleMarkAsPaid = async () => {
    if (!confirm('결제 완료로 표시하시겠습니까?')) return
    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid', paidAt: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error('Failed')
      fetchInvoice()
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
  }

  const handleDelete = async () => {
    if (!invoice || !confirm(`인보이스 "${invoice.invoiceNumber}"를 삭제하시겠습니까?`)) return
    try {
      const res = await fetch(`/api/invoices/${params.id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      router.push('/invoices')
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed') }
  }

  const handleCancel = async (reason: string) => {
    const res = await fetch(`/api/invoices/${params.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
    const cancellation = await res.json()
    router.push(`/invoices/${cancellation.id}`)
  }

  const isOverdue = invoice?.status === 'sent' && new Date(invoice.dueDate) < new Date()
  const displayStatus = isOverdue ? 'overdue' : (invoice?.status || '')

  // Live totals for edit mode
  const editTotals = editForm ? editForm.items.reduce((acc, item) => {
    const subtotal = Number(item.quantity) * Number(item.unitPrice)
    const vatAmount = subtotal * (Number(item.vatRate) / 100)
    return { subtotal: acc.subtotal + subtotal, totalVat: acc.totalVat + vatAmount, totalGross: acc.totalGross + subtotal + vatAmount }
  }, { subtotal: 0, totalVat: 0, totalGross: 0 }) : null

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-5">
          <div className="h-6 w-24 bg-zinc-100 rounded animate-pulse" />
          <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${40 + i * 15}%` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-xs text-red-700">{error || 'Invoice not found'}</p>
          </div>
          <Link href="/invoices" className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-3 h-3" /> 인보이스 목록으로
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Link href="/invoices" className="mt-0.5 p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-zinc-900 tracking-tight font-mono">{invoice.invoiceNumber}</h1>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${STATUS_STYLES[displayStatus] || STATUS_STYLES.draft}`}>
                  {STATUS_LABELS[displayStatus] || displayStatus}
                </span>
                {invoice.isLocked && (
                  <span className="text-[11px] text-zinc-400">잠김</span>
                )}
              </div>
              <p className="text-sm text-zinc-500 mt-0.5">{invoice.customer.name}{invoice.customer.company && ` · ${invoice.customer.company}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all disabled:opacity-50">
                  취소
                </button>
                <button onClick={handleSaveEdit} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50">
                  {saving ? '저장 중...' : '저장'}
                </button>
              </>
            ) : (
              <>
                <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all">
                  <FileDown className="w-3 h-3" /> PDF
                </a>
                {invoice.status === 'draft' && (
                  <>
                    <button onClick={() => startEditing(invoice)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all">
                      <Pencil className="w-3 h-3" /> 편집
                    </button>
                    <button onClick={handleSend}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all">
                      <Send className="w-3 h-3" /> 발송
                    </button>
                    <button onClick={handleDelete}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-500 text-xs font-medium rounded-lg hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all">
                      <Trash2 className="w-3 h-3" /> 삭제
                    </button>
                  </>
                )}
                {invoice.status === 'sent' && !invoice.isCancelled && (
                  <>
                    <button onClick={handleMarkAsPaid}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                      <Check className="w-3 h-3" /> 결제 완료
                    </button>
                    <button onClick={() => setShowCancelDialog(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-500 text-xs font-medium rounded-lg hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all">
                      <XCircle className="w-3 h-3" /> 취소
                    </button>
                  </>
                )}
                {(invoice.status === 'paid' || invoice.isCancelled) && !invoice.correctionType && !invoice.isCancelled && (
                  <button onClick={() => setShowCancelDialog(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-500 text-xs font-medium rounded-lg hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all">
                    <XCircle className="w-3 h-3" /> 취소
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Edit mode banner */}
        {editing && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
            <Pencil className="w-3 h-3 text-amber-600 flex-shrink-0" />
            <p className="text-xs font-medium text-amber-700">편집 모드 — 초안 단계에서만 수정 가능합니다.</p>
          </div>
        )}

        {/* Alerts */}
        {!editing && isOverdue && (
          <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <p className="text-xs font-medium text-red-700">
              마감일 초과 — 마감일: {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
            </p>
          </div>
        )}
        {!editing && invoice.isCancelled && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl">
            <Info className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-zinc-700">취소된 인보이스</p>
              {invoice.cancelledAt && <p className="text-[11px] text-zinc-500 mt-0.5">취소일: {new Date(invoice.cancelledAt).toLocaleDateString('de-DE')}</p>}
              {invoice.cancellationReason && <p className="text-[11px] text-zinc-500">사유: {invoice.cancellationReason}</p>}
              {invoice.correctedBy && (
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  취소 인보이스: <Link href={`/invoices/${invoice.correctedBy.id}`} className="font-mono hover:text-zinc-900 transition-colors">{invoice.correctedBy.invoiceNumber}</Link>
                </p>
              )}
            </div>
          </div>
        )}
        {!editing && invoice.correctionType && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
            <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-700">
                {invoice.correctionType === 'cancellation' ? '취소 인보이스' : '수정 인보이스'}
              </p>
              {invoice.corrects && (
                <p className="text-[11px] text-amber-600 mt-0.5">
                  참조: <Link href={`/invoices/${invoice.corrects.id}`} className="font-mono hover:text-amber-900 transition-colors">{invoice.corrects.invoiceNumber}</Link>
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Customer */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">고객 정보</h2>
              </div>
              <div className="p-5">
                <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    { label: '고객번호', value: invoice.customer.customerNumber },
                    { label: '이름', value: invoice.customer.name },
                    ...(invoice.customer.company ? [{ label: '회사', value: invoice.customer.company }] : []),
                    ...(invoice.customer.email ? [{ label: '이메일', value: invoice.customer.email }] : []),
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className={labelClass}>{label}</dt>
                      <dd className="text-xs font-medium text-zinc-700 mt-1">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Items */}
            {editing && editForm ? (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100">
                  <h2 className="text-sm font-semibold text-zinc-900">항목</h2>
                </div>
                <div className="p-5 space-y-3">
                  {editForm.items.map((item, idx) => (
                    <div key={idx} className="p-3 border border-zinc-100 rounded-lg space-y-2 bg-zinc-50/50">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">항목 {idx + 1}</span>
                        <button onClick={() => removeItem(idx)} className="p-1 text-zinc-400 hover:text-red-500 transition-colors rounded">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <label className={`${labelClass} mb-1 block`}>설명</label>
                          <input type="text" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                            className={inputClass} placeholder="항목 설명" />
                        </div>
                        <div className="col-span-2">
                          <label className={`${labelClass} mb-1 block`}>추가 정보 (선택)</label>
                          <input type="text" value={item.additionalInfo} onChange={e => updateItem(idx, 'additionalInfo', e.target.value)}
                            className={inputClass} placeholder="부가 설명" />
                        </div>
                        <div>
                          <label className={`${labelClass} mb-1 block`}>수량</label>
                          <input type="number" value={item.quantity} min="0" step="0.01"
                            onChange={e => updateItem(idx, 'quantity', e.target.value)}
                            className={inputClass} />
                        </div>
                        <div>
                          <label className={`${labelClass} mb-1 block`}>단위</label>
                          <input type="text" value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)}
                            className={inputClass} placeholder="Stück" />
                        </div>
                        <div>
                          <label className={`${labelClass} mb-1 block`}>단가 (€)</label>
                          <input type="number" value={item.unitPrice} min="0" step="0.01"
                            onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                            className={inputClass} />
                        </div>
                        <div>
                          <label className={`${labelClass} mb-1 block`}>VAT (%)</label>
                          <select value={item.vatRate} onChange={e => updateItem(idx, 'vatRate', parseFloat(e.target.value))}
                            className={inputClass}>
                            <option value="19">19%</option>
                            <option value="7">7%</option>
                            <option value="0">0%</option>
                          </select>
                        </div>
                      </div>
                      <div className="text-right text-xs font-semibold text-zinc-700 pt-1">
                        합계: {formatCurrency(calcItemTotal(item), 'EUR')}
                      </div>
                    </div>
                  ))}
                  <button onClick={addItem}
                    className="flex items-center gap-1.5 w-full px-3 py-2 border border-dashed border-zinc-300 text-zinc-500 text-xs font-medium rounded-lg hover:border-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all">
                    <Plus className="w-3.5 h-3.5" /> 항목 추가
                  </button>
                  {editTotals && (
                    <div className="pt-3 border-t border-zinc-100">
                      <div className="flex justify-end">
                        <div className="w-56 space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-xs text-zinc-500">소계</span>
                            <span className="text-xs tabular-nums text-zinc-700">{formatCurrency(editTotals.subtotal, 'EUR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-zinc-500">VAT</span>
                            <span className="text-xs tabular-nums text-amber-600">{formatCurrency(editTotals.totalVat, 'EUR')}</span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-zinc-200">
                            <span className="text-xs font-semibold text-zinc-900">총액</span>
                            <span className="text-sm font-semibold tabular-nums text-zinc-900">{formatCurrency(editTotals.totalGross, 'EUR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100">
                  <h2 className="text-sm font-semibold text-zinc-900">항목</h2>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400 w-8">#</th>
                      <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">설명</th>
                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-zinc-400">수량</th>
                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-zinc-400">단가</th>
                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-zinc-400">VAT</th>
                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-zinc-400">합계</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="px-5 py-3 text-xs text-zinc-400 tabular-nums">{idx + 1}</td>
                        <td className="px-5 py-3">
                          <p className="text-xs font-medium text-zinc-800">{item.description}</p>
                          {item.additionalInfo && <p className="text-[11px] text-zinc-400 mt-0.5 italic">{item.additionalInfo}</p>}
                        </td>
                        <td className="px-5 py-3 text-right text-xs tabular-nums text-zinc-600">{item.quantity} {item.unit}</td>
                        <td className="px-5 py-3 text-right text-xs tabular-nums text-zinc-600">{formatCurrency(item.unitPrice, 'EUR')}</td>
                        <td className="px-5 py-3 text-right text-xs tabular-nums text-zinc-500">{item.vatRate}%</td>
                        <td className="px-5 py-3 text-right text-xs font-semibold tabular-nums text-zinc-800">{formatCurrency(item.total, 'EUR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50/50">
                  <div className="flex justify-end">
                    <div className="w-56 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-xs text-zinc-500">소계</span>
                        <span className="text-xs tabular-nums text-zinc-700">{formatCurrency(invoice.subtotal, 'EUR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-zinc-500">VAT</span>
                        <span className="text-xs tabular-nums text-amber-600">{formatCurrency(invoice.totalVat, 'EUR')}</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-zinc-200">
                        <span className="text-xs font-semibold text-zinc-900">총액</span>
                        <span className="text-sm font-semibold tabular-nums text-zinc-900">{formatCurrency(invoice.totalGross, 'EUR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes & Terms */}
            {editing && editForm ? (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100">
                  <h2 className="text-sm font-semibold text-zinc-900">추가 정보</h2>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className={`${labelClass} mb-1.5 block`}>메모</label>
                    <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={3} className={`${inputClass} resize-none`} placeholder="메모 (선택)" />
                  </div>
                  <div>
                    <label className={`${labelClass} mb-1.5 block`}>조건</label>
                    <textarea value={editForm.terms} onChange={e => setEditForm({ ...editForm, terms: e.target.value })}
                      rows={3} className={`${inputClass} resize-none`} placeholder="결제 조건 (선택)" />
                  </div>
                </div>
              </div>
            ) : (invoice.notes || invoice.terms) ? (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100">
                  <h2 className="text-sm font-semibold text-zinc-900">추가 정보</h2>
                </div>
                <div className="p-5 space-y-4">
                  {invoice.notes && (
                    <div>
                      <p className={`${labelClass} mb-1`}>메모</p>
                      <p className="text-xs text-zinc-600 whitespace-pre-wrap">{invoice.notes}</p>
                    </div>
                  )}
                  {invoice.terms && (
                    <div>
                      <p className={`${labelClass} mb-1`}>조건</p>
                      <p className="text-xs text-zinc-600 whitespace-pre-wrap">{invoice.terms}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Details */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">상세 정보</h2>
              </div>
              {editing && editForm ? (
                <div className="p-5 space-y-3">
                  <div>
                    <label className={`${labelClass} mb-1.5 block`}>인보이스 번호</label>
                    <input type="text" value={editForm.invoiceNumber} onChange={e => setEditForm({ ...editForm, invoiceNumber: e.target.value })}
                      className={`${inputClass} font-mono`} />
                    <p className="text-[10px] text-zinc-400 mt-1">초안에서만 수정 가능. 중복 불가.</p>
                  </div>
                  <div>
                    <label className={`${labelClass} mb-1.5 block`}>발행일</label>
                    <input type="date" value={editForm.invoiceDate} onChange={e => setEditForm({ ...editForm, invoiceDate: e.target.value })}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className={`${labelClass} mb-1.5 block`}>마감일</label>
                    <input type="date" value={editForm.dueDate} onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className={`${labelClass} mb-1.5 block`}>납품일 (선택)</label>
                    <input type="date" value={editForm.deliveryDate} onChange={e => setEditForm({ ...editForm, deliveryDate: e.target.value })}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className={`${labelClass} mb-1.5 block`}>결제 조건</label>
                    <input type="text" value={editForm.paymentTerms} onChange={e => setEditForm({ ...editForm, paymentTerms: e.target.value })}
                      className={inputClass} />
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  {[
                    { label: '발행일', value: new Date(invoice.invoiceDate).toLocaleDateString('de-DE') },
                    { label: '마감일', value: new Date(invoice.dueDate).toLocaleDateString('de-DE') },
                    ...(invoice.deliveryDate ? [{ label: '납품일', value: new Date(invoice.deliveryDate).toLocaleDateString('de-DE') }] : []),
                    { label: '결제 조건', value: invoice.paymentTerms },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className={labelClass}>{label}</p>
                      <p className="text-xs font-medium text-zinc-700 mt-1 tabular-nums">{value}</p>
                    </div>
                  ))}
                  {invoice.quote && (
                    <div>
                      <p className={labelClass}>연결된 견적서</p>
                      <Link href={`/quotes/${invoice.quote.id}`} className="text-xs font-mono text-zinc-700 hover:text-zinc-900 transition-colors mt-1 block">
                        {invoice.quote.quoteNumber}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment */}
            {!editing && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100">
                  <h2 className="text-sm font-semibold text-zinc-900">결제 정보</h2>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <p className={labelClass}>상태</p>
                    <p className={`text-xs font-medium mt-1 ${invoice.status === 'paid' ? 'text-emerald-600' : 'text-zinc-500'}`}>
                      {invoice.status === 'paid' ? '결제 완료' : '미결제'}
                    </p>
                  </div>
                  {invoice.paidAt && (
                    <div>
                      <p className={labelClass}>결제일</p>
                      <p className="text-xs font-medium text-zinc-700 mt-1 tabular-nums">{new Date(invoice.paidAt).toLocaleDateString('de-DE')}</p>
                    </div>
                  )}
                  {invoice.paidAmount > 0 && (
                    <div>
                      <p className={labelClass}>결제 금액</p>
                      <p className="text-xs font-semibold tabular-nums text-emerald-600 mt-1">{formatCurrency(invoice.paidAmount, 'EUR')}</p>
                    </div>
                  )}
                  {invoice.paymentMethod && (
                    <div>
                      <p className={labelClass}>결제 방법</p>
                      <p className="text-xs font-medium text-zinc-700 mt-1">{invoice.paymentMethod}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!editing && invoice.isLocked && !invoice.correctionType && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
                <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">발송된 인보이스는 수정할 수 없습니다. 취소 또는 수정 인보이스를 발행하세요.</p>
              </div>
            )}
          </div>
        </div>

        {invoice && (
          <CancelDialog
            isOpen={showCancelDialog}
            onClose={() => setShowCancelDialog(false)}
            onConfirm={handleCancel}
            invoiceNumber={invoice.invoiceNumber}
            totalGross={invoice.totalGross}
          />
        )}

      </div>
    </div>
  )
}

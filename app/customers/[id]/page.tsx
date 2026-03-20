'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Trash2, Check, X, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Customer {
  id: string
  customerNumber: string
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  postalCode?: string
  city?: string
  country: string
  vatId?: string
  taxExempt: boolean
  notes?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quotes?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoices?: any[]
  createdAt: string
}

const COUNTRY_NAMES: Record<string, string> = {
  DE: 'Deutschland', AT: 'Österreich', CH: 'Schweiz',
  FR: 'Frankreich', NL: 'Niederlande', BE: 'Belgien', LU: 'Luxemburg',
  GB: 'United Kingdom', IE: 'Ireland', ES: 'Spanien', PT: 'Portugal',
  IT: 'Italien', SE: 'Schweden', NO: 'Norwegen', DK: 'Dänemark', FI: 'Finnland',
  PL: 'Polen', CZ: 'Tschechien', SK: 'Slowakei', HU: 'Ungarn',
  RO: 'Rumänien', HR: 'Kroatien', GR: 'Griechenland',
  KR: 'South Korea', JP: 'Japan', CN: 'China', TW: 'Taiwan', HK: 'Hong Kong',
  TH: 'Thailand', VN: 'Vietnam', SG: 'Singapore', MY: 'Malaysia',
  ID: 'Indonesia', PH: 'Philippines',
  US: 'USA', CA: 'Kanada', AU: 'Australien', IN: 'Indien',
  TR: 'Türkei', AE: 'United Arab Emirates',
}

const STATUS_LABELS: Record<string, string> = {
  draft: '초안', sent: '발송됨', accepted: '수락됨', rejected: '거절됨',
  expired: '만료됨', paid: '결제됨', overdue: '연체', cancelled: '취소됨',
}
const STATUS_STYLES: Record<string, string> = {
  draft:    'bg-zinc-100 text-zinc-500 border-zinc-200',
  sent:     'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  overdue:  'bg-red-50 text-red-600 border-red-200',
  expired:  'bg-zinc-100 text-zinc-400 border-zinc-200',
  cancelled:'bg-zinc-100 text-zinc-400 border-zinc-200',
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Customer>>({})

  useEffect(() => {
    fetchCustomer()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/customers/${params.id}`)
      if (!res.ok) throw new Error('Customer not found')
      const data = await res.json()
      setCustomer(data)
      setFormData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/customers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to update customer')
      const updated = await res.json()
      setCustomer(updated)
      setEditing(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update customer')
    }
  }

  const handleDelete = async () => {
    if (!customer) return
    if (!confirm(`정말 "${customer.name}" 고객을 삭제하시겠습니까?`)) return
    try {
      const res = await fetch(`/api/customers/${params.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete customer')
      }
      router.push('/customers')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete customer')
    }
  }

  const labelClass = 'text-[10px] font-semibold uppercase tracking-widest text-zinc-400'
  const inputClass = 'h-8 text-xs border-zinc-200 focus-visible:ring-zinc-900'

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-5">
          <div className="h-6 w-24 bg-zinc-100 rounded animate-pulse" />
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="h-2.5 w-20 bg-zinc-100 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="h-2 w-16 bg-zinc-100 rounded animate-pulse mb-1.5" />
                  <div className="h-3 w-28 bg-zinc-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-xs text-red-700">{error || 'Customer not found'}</p>
          </div>
          <Link href="/customers" className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-3 h-3" /> 고객 목록으로
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
            <Link
              href="/customers"
              className="mt-0.5 p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">{customer.name}</h1>
              <p className="text-sm text-zinc-400 mt-0.5 font-mono">{customer.customerNumber}</p>
            </div>
          </div>
          {!editing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all"
              >
                <Pencil className="w-3 h-3" /> 편집
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-500 text-xs font-medium rounded-lg hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-3 h-3" /> 삭제
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setEditing(false); setFormData(customer) }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-500 text-xs font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all"
            >
              <X className="w-3 h-3" /> 취소
            </button>
          )}
        </div>

        {editing ? (
          /* Edit Form */
          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">정보 편집</h2>
              </div>
              <div className="p-5 space-y-4">
                {/* 기본 정보 */}
                <div className="space-y-1.5">
                  <p className={labelClass}>이름</p>
                  <Input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <p className={labelClass}>회사명</p>
                  <Input value={formData.company || ''} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className={labelClass}>이메일</p>
                    <Input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <p className={labelClass}>전화번호</p>
                    <Input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass} />
                  </div>
                </div>
                {/* 주소 */}
                <div className="pt-2 border-t border-zinc-100 space-y-4">
                  <div className="space-y-1.5">
                    <p className={labelClass}>도로명 주소</p>
                    <Input value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Hauptstraße 1" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className={labelClass}>우편번호</p>
                      <Input value={formData.postalCode || ''} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} placeholder="10115" className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <p className={labelClass}>도시</p>
                      <Input value={formData.city || ''} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Berlin" className={inputClass} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className={labelClass}>국가</p>
                    <select
                      value={formData.country || 'DE'}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full h-8 text-xs border border-zinc-200 rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <optgroup label="D-A-CH">
                        <option value="DE">Deutschland</option>
                        <option value="AT">Österreich</option>
                        <option value="CH">Schweiz</option>
                      </optgroup>
                      <optgroup label="Europa (West)">
                        <option value="FR">Frankreich</option>
                        <option value="NL">Niederlande</option>
                        <option value="BE">Belgien</option>
                        <option value="LU">Luxemburg</option>
                        <option value="GB">Vereinigtes Königreich</option>
                        <option value="IE">Irland</option>
                        <option value="ES">Spanien</option>
                        <option value="PT">Portugal</option>
                        <option value="IT">Italien</option>
                        <option value="SE">Schweden</option>
                        <option value="NO">Norwegen</option>
                        <option value="DK">Dänemark</option>
                        <option value="FI">Finnland</option>
                      </optgroup>
                      <optgroup label="Europa (Ost)">
                        <option value="PL">Polen</option>
                        <option value="CZ">Tschechien</option>
                        <option value="SK">Slowakei</option>
                        <option value="HU">Ungarn</option>
                        <option value="RO">Rumänien</option>
                        <option value="HR">Kroatien</option>
                        <option value="GR">Griechenland</option>
                      </optgroup>
                      <optgroup label="East Asia">
                        <option value="KR">South Korea</option>
                        <option value="JP">Japan</option>
                        <option value="CN">China</option>
                        <option value="TW">Taiwan</option>
                        <option value="HK">Hong Kong</option>
                      </optgroup>
                      <optgroup label="Southeast Asia">
                        <option value="TH">Thailand</option>
                        <option value="VN">Vietnam</option>
                        <option value="SG">Singapore</option>
                        <option value="MY">Malaysia</option>
                        <option value="ID">Indonesia</option>
                        <option value="PH">Philippines</option>
                      </optgroup>
                      <optgroup label="기타">
                        <option value="US">USA</option>
                        <option value="CA">Kanada</option>
                        <option value="AU">Australien</option>
                        <option value="IN">Indien</option>
                        <option value="TR">Türkei</option>
                        <option value="AE">Vereinigte Arabische Emirate</option>
                      </optgroup>
                    </select>
                  </div>
                </div>
                {/* 세금 정보 */}
                <div className="pt-2 border-t border-zinc-100 space-y-4">
                  <div className="space-y-1.5">
                    <p className={labelClass}>VAT ID (USt-IdNr.)</p>
                    <Input value={formData.vatId || ''} onChange={(e) => setFormData({ ...formData, vatId: e.target.value })} placeholder="DE123456789" className={inputClass} />
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.taxExempt || false}
                      onChange={(e) => setFormData({ ...formData, taxExempt: e.target.checked })}
                      className="accent-zinc-900"
                    />
                    <span className="text-xs text-zinc-600">면세 고객 (Steuerbefreit)</span>
                  </label>
                </div>
                {/* 메모 */}
                <div className="pt-2 border-t border-zinc-100 space-y-1.5">
                  <p className={labelClass}>메모</p>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="내부 메모..."
                    className="w-full text-xs border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <Check className="w-4 h-4" /> 저장
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <p className={`${labelClass} mb-2`}>견적서</p>
                <p className="text-2xl font-semibold tabular-nums text-zinc-900">{customer.quotes?.length || 0}</p>
              </div>
              <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <p className={`${labelClass} mb-2`}>인보이스</p>
                <p className="text-2xl font-semibold tabular-nums text-zinc-900">{customer.invoices?.length || 0}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-semibold text-zinc-900">연락처 정보</h2>
              </div>
              <div className="p-5">
                <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { label: '이름', value: customer.name },
                    { label: '회사', value: customer.company },
                    { label: '이메일', value: customer.email },
                    { label: '전화', value: customer.phone },
                    { label: '주소', value: customer.address },
                    { label: '우편번호', value: customer.postalCode },
                    { label: '도시', value: customer.city },
                    { label: '국가', value: COUNTRY_NAMES[customer.country] || customer.country },
                    { label: 'VAT ID', value: customer.vatId },
                    { label: '면세', value: customer.taxExempt ? '예' : '아니오' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className={labelClass}>{label}</dt>
                      <dd className="text-xs font-medium text-zinc-700 mt-1">{value || <span className="text-zinc-300">—</span>}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Notes */}
            {customer.notes && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100">
                  <h2 className="text-sm font-semibold text-zinc-900">메모</h2>
                </div>
                <div className="p-5">
                  <p className="text-xs text-zinc-600 whitespace-pre-wrap">{customer.notes}</p>
                </div>
              </div>
            )}

            {/* Quotes */}
            {customer.quotes && customer.quotes.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-zinc-900">최근 견적서</h2>
                  <Link href="/quotes" className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors">
                    전체 보기 <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="divide-y divide-zinc-50">
                  {customer.quotes.slice(0, 5).map((quote) => (
                    <div key={quote.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50/70 transition-colors">
                      <Link href={`/quotes/${quote.id}`} className="text-xs font-mono text-zinc-700 hover:text-zinc-900 transition-colors">
                        {quote.quoteNumber}
                      </Link>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${STATUS_STYLES[quote.status] || STATUS_STYLES.draft}`}>
                        {STATUS_LABELS[quote.status] || quote.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invoices */}
            {customer.invoices && customer.invoices.length > 0 && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-zinc-900">최근 인보이스</h2>
                  <Link href="/invoices" className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors">
                    전체 보기 <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="divide-y divide-zinc-50">
                  {customer.invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50/70 transition-colors">
                      <Link href={`/invoices/${invoice.id}`} className="text-xs font-mono text-zinc-700 hover:text-zinc-900 transition-colors">
                        {invoice.invoiceNumber}
                      </Link>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${STATUS_STYLES[invoice.status] || STATUS_STYLES.draft}`}>
                        {STATUS_LABELS[invoice.status] || invoice.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

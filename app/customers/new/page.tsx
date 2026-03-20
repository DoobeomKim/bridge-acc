'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function NewCustomerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'DE',
    vatId: '',
    taxExempt: false,
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create customer')
      }

      const customer = await res.json()
      router.push(`/customers/${customer.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const labelClass = 'text-[10px] font-semibold uppercase tracking-widest text-zinc-400'
  const inputClass = 'h-8 text-xs border-zinc-200 focus-visible:ring-zinc-900'

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">고객 추가</h1>
            <p className="text-sm text-zinc-500 mt-0.5">새 고객 정보를 입력하세요</p>
          </div>
        </div>

        {/* Error */}
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
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <p className={labelClass}>이름 <span className="text-red-400">*</span></p>
                <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Max Mustermann" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <p className={labelClass}>회사명</p>
                <Input name="company" value={formData.company} onChange={handleChange} placeholder="Mustermann GmbH" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className={labelClass}>이메일</p>
                  <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="max@example.com" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <p className={labelClass}>전화번호</p>
                  <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+49 123 456789" className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* 주소 */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">주소</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <p className={labelClass}>도로명 주소</p>
                <Input name="address" value={formData.address} onChange={handleChange} placeholder="Hauptstraße 1" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className={labelClass}>우편번호</p>
                  <Input name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="10115" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <p className={labelClass}>도시</p>
                  <Input name="city" value={formData.city} onChange={handleChange} placeholder="Berlin" className={inputClass} />
                </div>
              </div>
              <div className="space-y-1.5">
                <p className={labelClass}>국가</p>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
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
          </div>

          {/* 세금 정보 */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">세금 정보</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <p className={labelClass}>VAT ID (USt-IdNr.)</p>
                <Input name="vatId" value={formData.vatId} onChange={handleChange} placeholder="DE123456789" className={inputClass} />
                <p className="text-[11px] text-zinc-400">EU 내 B2B 거래 시 필요 (역과세)</p>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="taxExempt"
                  checked={formData.taxExempt}
                  onChange={handleChange}
                  className="accent-zinc-900"
                />
                <span className="text-xs text-zinc-600">면세 고객 (Steuerbefreit)</span>
              </label>
            </div>
          </div>

          {/* 메모 */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">메모</h2>
            </div>
            <div className="p-5">
              <div className="space-y-1.5">
                <p className={labelClass}>내부 메모 (선택)</p>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="고객 관련 내부 메모..."
                  className="w-full text-xs border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '저장 중...' : '고객 추가'}
            </button>
            <Link
              href="/customers"
              className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 text-sm font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all text-center"
            >
              취소
            </Link>
          </div>
        </form>

      </div>
    </div>
  )
}

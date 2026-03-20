'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Check } from 'lucide-react'

interface CompanySettingsProps {
  settings: {
    companyName: string | null
    email: string | null
    taxNumber: string | null
    vatId: string | null
    address: string | null
    defaultVatRate: number
    fiscalYearStart: number
    hrb: string | null
    managingDirector: string | null
    bankName: string | null
    iban: string | null
    bic: string | null
  }
  onSaved?: () => void
}

export function CompanySettings({ settings, onSaved }: CompanySettingsProps) {
  const [companyName, setCompanyName] = useState(settings.companyName || '')
  const [email, setEmail] = useState(settings.email || '')
  const [taxNumber, setTaxNumber] = useState(settings.taxNumber || '')
  const [vatId, setVatId] = useState(settings.vatId || '')
  const [address, setAddress] = useState(settings.address || '')
  const [defaultVatRate, setDefaultVatRate] = useState(settings.defaultVatRate.toString())
  const [hrb, setHrb] = useState(settings.hrb || '')
  const [managingDirector, setManagingDirector] = useState(settings.managingDirector || '')
  const [bankName, setBankName] = useState(settings.bankName || '')
  const [iban, setIban] = useState(settings.iban || '')
  const [bic, setBic] = useState(settings.bic || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName || null,
          email: email || null,
          taxNumber: taxNumber || null,
          vatId: vatId || null,
          address: address || null,
          defaultVatRate: parseFloat(defaultVatRate),
          hrb: hrb || null,
          managingDirector: managingDirector || null,
          bankName: bankName || null,
          iban: iban || null,
          bic: bic || null,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        onSaved?.()
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'h-8 text-xs border-zinc-200 focus-visible:ring-zinc-900'
  const labelClass = 'text-[10px] font-semibold uppercase tracking-widest text-zinc-400'

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100">
        <h2 className="text-sm font-semibold text-zinc-900">회사 정보</h2>
        <p className="text-xs text-zinc-400 mt-0.5">인보이스 및 PDF에 사용되는 정보</p>
      </div>
      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <p className={labelClass}>회사명</p>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Meine GmbH" className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <p className={labelClass}>회사 이메일</p>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@meine-gmbh.de" className={inputClass} />
          <p className="text-[11px] text-zinc-400">인보이스 및 견적서 PDF에 표시됩니다</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <p className={labelClass}>세금번호 (Steuernummer)</p>
            <Input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} placeholder="123/456/78901" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <p className={labelClass}>VAT ID (USt-IdNr.)</p>
            <Input value={vatId} onChange={(e) => setVatId(e.target.value)} placeholder="DE123456789" className={inputClass} />
          </div>
        </div>

        <div className="space-y-1.5">
          <p className={labelClass}>주소</p>
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Musterstraße 123, 10115 Berlin"
            rows={2}
            className="text-xs border-zinc-200 focus-visible:ring-zinc-900 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <p className={labelClass}>기본 VAT 세율 (%)</p>
          <div className="flex items-center gap-2">
            <Input type="number" value={defaultVatRate} onChange={(e) => setDefaultVatRate(e.target.value)} placeholder="19" className={`w-24 ${inputClass}`} />
            <span className="text-[11px] text-zinc-400">0% · 7% · 19% (DE 표준)</span>
          </div>
        </div>

        {/* Legal Info */}
        <div className="pt-4 border-t border-zinc-100 space-y-4">
          <p className="text-xs font-semibold text-zinc-700">법적 정보 (PDF 푸터)</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className={labelClass}>HRB (상업등록번호)</p>
              <Input value={hrb} onChange={(e) => setHrb(e.target.value)} placeholder="10534" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <p className={labelClass}>대표이사 (Geschäftsführer)</p>
              <Input value={managingDirector} onChange={(e) => setManagingDirector(e.target.value)} placeholder="Eu Ra Jung" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Bank Info */}
        <div className="pt-4 border-t border-zinc-100 space-y-4">
          <p className="text-xs font-semibold text-zinc-700">은행 정보 (PDF 푸터)</p>
          <div className="space-y-1.5">
            <p className={labelClass}>은행명</p>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Vivid Money S.A." className={inputClass} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className={labelClass}>IBAN</p>
              <Input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="DE72 2022 0800 ..." className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <p className={labelClass}>BIC / SWIFT</p>
              <Input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="SXPYDEHHXXX" className={inputClass} />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {saved ? (
              <><Check className="w-4 h-4" /> 저장됨</>
            ) : saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

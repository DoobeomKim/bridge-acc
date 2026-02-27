'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CompanySettingsProps {
  settings: {
    companyName: string | null
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: companyName || null,
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
        setMessage({ type: 'success', text: '설정이 저장되었습니다' })
        if (onSaved) onSaved()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '저장 실패',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>회사 정보 (Firmendaten)</CardTitle>
        <CardDescription>
          회사의 기본 정보를 입력하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">회사명 (Firmenname)</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="예: Meine GmbH"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxNumber">세금번호 (Steuernummer)</Label>
            <Input
              id="taxNumber"
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
              placeholder="예: 123/456/78901"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatId">VAT ID (USt-IdNr.)</Label>
            <Input
              id="vatId"
              value={vatId}
              onChange={(e) => setVatId(e.target.value)}
              placeholder="예: DE123456789"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">주소 (Adresse)</Label>
          <Textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="예: Musterstraße 123, 10115 Berlin"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultVatRate">기본 VAT 세율 (%)</Label>
          <Input
            id="defaultVatRate"
            type="number"
            value={defaultVatRate}
            onChange={(e) => setDefaultVatRate(e.target.value)}
            placeholder="19"
          />
          <p className="text-xs text-muted-foreground">
            독일: 0% (면세), 7% (감면), 19% (표준)
          </p>
        </div>

        {/* 법적 정보 섹션 */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium mb-3">법적 정보 (PDF 푸터용)</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hrb">HRB (상업등록번호)</Label>
              <Input
                id="hrb"
                value={hrb}
                onChange={(e) => setHrb(e.target.value)}
                placeholder="예: 10534"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="managingDirector">대표이사 (Geschäftsführer)</Label>
              <Input
                id="managingDirector"
                value={managingDirector}
                onChange={(e) => setManagingDirector(e.target.value)}
                placeholder="예: Eu Ra Jung"
              />
            </div>
          </div>
        </div>

        {/* 은행 정보 섹션 */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium mb-3">은행 정보 (PDF 푸터용)</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">은행명 (Bank)</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="예: Vivid Money S.A."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="예: DE72 2022 0800 0052 0192 95"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bic">BIC/SWIFT</Label>
                <Input
                  id="bic"
                  value={bic}
                  onChange={(e) => setBic(e.target.value)}
                  placeholder="예: SXPYDEHHXXX"
                />
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? '저장 중...' : '저장'}
        </Button>
      </CardContent>
    </Card>
  )
}

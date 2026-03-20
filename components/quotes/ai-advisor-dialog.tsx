'use client'

import { useState } from 'react'
import { X, Sparkles, RotateCcw, Check, AlertTriangle, Lightbulb, ListOrdered } from 'lucide-react'
import { formatCurrency } from '@/lib/utils-accounting'

interface AIAdvice {
  priceRange: { min: number; max: number }
  recommendedPrice: number
  items: Array<{
    description: string
    quantity: number
    unit: string
    unitPrice: number
    reasoning: string
  }>
  hourlyRate: { min: number; max: number }
  totalHours: number
  advice: string
  risks: string[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onApply: (items: any[]) => void
}

const labelClass = 'text-[10px] font-semibold uppercase tracking-widest text-zinc-400'

export function AIAdvisorDialog({ isOpen, onClose, onApply }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [advice, setAdvice] = useState<AIAdvice | null>(null)
  const [projectDescription, setProjectDescription] = useState('')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [industry, setIndustry] = useState('')

  const handleGetAdvice = async () => {
    if (!projectDescription || projectDescription.length < 10) {
      setError('Bitte geben Sie eine Projektbeschreibung ein (mindestens 10 Zeichen)')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/quote-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectDescription,
          estimatedHours: estimatedHours ? parseInt(estimatedHours) : undefined,
          industry: industry || undefined,
          customerType: 'business',
        }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to get advice')
      }
      setAdvice(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (!advice) return
    onApply(advice.items.map((item) => ({
      description: item.description,
      additionalInfo: item.reasoning,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      vatRate: 19,
    })))
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-zinc-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-zinc-500" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">AI 가격 상담</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Claude AI가 적정 가격을 제안합니다</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {!advice ? (
            <>
              {/* Input form */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className={labelClass}>프로젝트 설명 <span className="text-red-400">*</span></p>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={4}
                    className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                    placeholder="z.B. E-Commerce Website mit React, Backend API, Datenbank, Admin-Panel..."
                  />
                  <p className="text-[11px] text-zinc-400">Je detaillierter, desto besser die Empfehlung</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className={labelClass}>예상 시간 (선택)</p>
                    <input
                      type="number"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      min="1"
                      className="h-8 w-full text-xs border border-zinc-200 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="z.B. 40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className={labelClass}>업종 (선택)</p>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="h-8 w-full text-xs border border-zinc-200 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="z.B. E-Commerce, SaaS..."
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleGetAdvice}
                disabled={loading}
                className="w-full py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                    <span>분석 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    AI 추천 가격 조회
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Price recommendation */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5">
                <p className={`${labelClass} mb-3`}>추천 가격</p>
                <div className="text-2xl font-semibold tabular-nums text-zinc-900">
                  {formatCurrency(advice.recommendedPrice, 'EUR')}
                </div>
                <p className="text-xs text-zinc-500 mt-1.5">
                  범위: {formatCurrency(advice.priceRange.min, 'EUR')} — {formatCurrency(advice.priceRange.max, 'EUR')}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  시간당: {advice.hourlyRate.min}–{advice.hourlyRate.max} € · 예상 {advice.totalHours}h
                </p>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-zinc-400" />
                  <p className={labelClass}>제안 항목</p>
                </div>
                <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
                  {advice.items.map((item, index) => (
                    <div key={index} className="flex items-start justify-between px-4 py-3 hover:bg-zinc-50/70 transition-colors">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-xs font-medium text-zinc-800">{item.description}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{item.reasoning}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold tabular-nums text-zinc-900">
                          {formatCurrency(item.quantity * item.unitPrice, 'EUR')}
                        </p>
                        <p className="text-[11px] text-zinc-400 tabular-nums">
                          {item.quantity} {item.unit} × {item.unitPrice} €
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice */}
              <div className="flex items-start gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-zinc-700">{advice.advice}</p>
              </div>

              {/* Risks */}
              {advice.risks.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600">리스크 & 고려사항</p>
                  </div>
                  <ul className="space-y-1">
                    {advice.risks.map((risk, index) => (
                      <li key={index} className="text-xs text-amber-800 flex items-start gap-1.5">
                        <span className="text-amber-400 mt-0.5">·</span> {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleApply}
                  className="flex-1 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> 항목 적용
                </button>
                <button
                  onClick={() => setAdvice(null)}
                  className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 text-sm font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 다시 조회
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

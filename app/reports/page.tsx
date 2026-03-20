'use client'

import { useState } from 'react'
import { BarChart3, FileDown, Table2, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils-accounting'
import { CATEGORY_LABELS } from '@/types'
import { Input } from '@/components/ui/input'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

interface ReportPreview {
  transactionCount: number
  summary: {
    totalIncome: number
    totalExpense: number
    netAmount: number
  }
  categoryBreakdown: {
    category: string
    amount: number
    count: number
  }[]
  vatSummary: {
    rate: number
    vatAmount: number
  }[]
}

const QUICK_PERIODS = [
  { label: '이번 달', value: 'thisMonth' },
  { label: '지난 달', value: 'lastMonth' },
  { label: '이번 분기', value: 'thisQuarter' },
] as const

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [preview, setPreview] = useState<ReportPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handlePreview = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      })
      const data = await response.json()
      if (data.success) setPreview(data.data)
      else alert(data.error || '미리보기 생성 실패')
    } catch {
      alert('미리보기 생성 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (format_type: 'excel' | 'csv') => {
    setDownloading(true)
    try {
      const params = new URLSearchParams({ startDate, endDate, format: format_type })
      const response = await fetch(`/api/reports?${params.toString()}`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Download failed')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `회계자료_${startDate}_${endDate}.${format_type === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert(error instanceof Error ? error.message : '다운로드 중 오류가 발생했습니다')
    } finally {
      setDownloading(false)
    }
  }

  const setQuickPeriod = (period: string) => {
    const now = new Date()
    if (period === 'thisMonth') {
      setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'))
      setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'))
    } else if (period === 'lastMonth') {
      const lastMonth = subMonths(now, 1)
      setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'))
      setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'))
    } else if (period === 'thisQuarter') {
      const quarter = Math.floor(now.getMonth() / 3)
      setStartDate(format(new Date(now.getFullYear(), quarter * 3, 1), 'yyyy-MM-dd'))
      setEndDate(format(new Date(now.getFullYear(), quarter * 3 + 3, 0), 'yyyy-MM-dd'))
    }
  }

  const net = preview?.summary.netAmount ?? 0

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">리포트</h1>
          <p className="text-sm text-zinc-500 mt-0.5">회계사 제출용 리포트 생성</p>
        </div>

        {/* Period Selection */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">기간 선택</p>

          <div className="flex flex-wrap gap-2">
            {QUICK_PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setQuickPeriod(p.value)}
                className="px-3 h-7 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[160px] h-8 text-xs border-zinc-200"
            />
            <span className="text-xs text-zinc-400">~</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[160px] h-8 text-xs border-zinc-200"
            />
            <button
              onClick={handlePreview}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 h-8 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </>
              ) : (
                <><BarChart3 className="w-3.5 h-3.5" /> 미리보기</>
              )}
            </button>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-zinc-200 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500" />
                <div className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">총 수입</p>
                  <p className="text-2xl font-semibold tabular-nums text-emerald-600">
                    {formatCurrency(preview.summary.totalIncome)}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">{preview.transactionCount}건 기준</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-zinc-200 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-400" />
                <div className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">총 지출</p>
                  <p className="text-2xl font-semibold tabular-nums text-red-500">
                    {formatCurrency(preview.summary.totalExpense)}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">{startDate} ~ {endDate}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-zinc-200 relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${net >= 0 ? 'bg-emerald-500' : 'bg-red-400'}`} />
                <div className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">순이익</p>
                  <p className={`text-2xl font-semibold tabular-nums ${net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {net > 0 ? '+' : ''}{formatCurrency(net)}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">수입 - 지출</p>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              {/* VAT Summary */}
              {preview.vatSummary.length > 0 && (
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100">
                    <h2 className="text-sm font-semibold text-zinc-900">VAT 요약</h2>
                  </div>
                  <div className="p-5 space-y-2">
                    {preview.vatSummary.map((vat) => (
                      <div key={vat.rate} className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            {vat.rate}%
                          </span>
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-amber-600">
                          {formatCurrency(vat.vatAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Breakdown */}
              {preview.categoryBreakdown.length > 0 && (
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100">
                    <h2 className="text-sm font-semibold text-zinc-900">카테고리별 요약</h2>
                  </div>
                  <div className="p-5 space-y-3">
                    {preview.categoryBreakdown.slice(0, 6).map((cat) => {
                      const maxAbs = Math.max(...preview.categoryBreakdown.map((c) => Math.abs(c.amount)))
                      const pct = maxAbs > 0 ? (Math.abs(cat.amount) / maxAbs) * 100 : 0
                      return (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-zinc-700">
                                {CATEGORY_LABELS[cat.category as keyof typeof CATEGORY_LABELS] || cat.category}
                              </span>
                              <span className="text-[11px] text-zinc-400">({cat.count}건)</span>
                            </div>
                            <span className="text-xs font-semibold tabular-nums text-zinc-800">
                              {formatCurrency(cat.amount)}
                            </span>
                          </div>
                          <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full bg-zinc-800 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Download */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-4">다운로드</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownload('excel')}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  <Table2 className="w-4 h-4" /> Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 text-zinc-700 text-sm font-medium rounded-lg hover:border-zinc-900 hover:bg-zinc-50 transition-all disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4" /> CSV
                </button>
                <p className="text-xs text-zinc-400 ml-2">
                  <ChevronRight className="w-3 h-3 inline" /> Excel에는 요약 + 거래내역이 포함됩니다
                </p>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

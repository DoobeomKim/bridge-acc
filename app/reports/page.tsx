'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils-accounting'
import { CATEGORY_LABELS } from '@/types'
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

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  )
  const [preview, setPreview] = useState<ReportPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handlePreview = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reports/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate, endDate }),
      })

      const data = await response.json()

      if (data.success) {
        setPreview(data.data)
      } else {
        alert(data.error || '미리보기 생성 실패')
      }
    } catch (error) {
      console.error('Error generating preview:', error)
      alert('미리보기 생성 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (format_type: 'excel' | 'csv') => {
    setDownloading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        format: format_type,
      })

      const response = await fetch(`/api/reports?${params.toString()}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Download failed')
      }

      // 파일 다운로드
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
      console.error('Error downloading report:', error)
      alert(error instanceof Error ? error.message : '다운로드 중 오류가 발생했습니다')
    } finally {
      setDownloading(false)
    }
  }

  const setQuickPeriod = (period: 'thisMonth' | 'lastMonth' | 'thisQuarter') => {
    const now = new Date()
    switch (period) {
      case 'thisMonth':
        setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'))
        setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'))
        break
      case 'lastMonth':
        const lastMonth = subMonths(now, 1)
        setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'))
        setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'))
        break
      case 'thisQuarter':
        const quarter = Math.floor(now.getMonth() / 3)
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1)
        const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0)
        setStartDate(format(quarterStart, 'yyyy-MM-dd'))
        setEndDate(format(quarterEnd, 'yyyy-MM-dd'))
        break
    }
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">리포트 (Berichte)</h1>
        <p className="text-muted-foreground">
          회계사 제출용 리포트를 생성하세요
        </p>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>기간 선택 (Zeitraum)</CardTitle>
          <CardDescription>
            리포트를 생성할 기간을 선택하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Period Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickPeriod('thisMonth')}
            >
              이번 달
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickPeriod('lastMonth')}
            >
              지난 달
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickPeriod('thisQuarter')}
            >
              이번 분기
            </Button>
          </div>

          {/* Custom Date Range */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">시작 날짜</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">종료 날짜</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handlePreview} disabled={loading} className="w-full">
            {loading ? '미리보기 생성 중...' : '미리보기'}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      {preview && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>리포트 미리보기</CardTitle>
              <CardDescription>
                총 {preview.transactionCount}개의 거래
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">총 수입</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(preview.summary.totalIncome)}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">총 지출</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(preview.summary.totalExpense)}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">순이익</p>
                  <p className={`text-2xl font-bold ${preview.summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(preview.summary.netAmount)}
                  </p>
                </div>
              </div>

              {/* VAT Summary */}
              {preview.vatSummary.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">VAT 요약</h3>
                  <div className="space-y-2">
                    {preview.vatSummary.map((vat) => (
                      <div key={vat.rate} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{vat.rate}%</span>
                        <span className="text-sm font-bold">
                          {formatCurrency(vat.vatAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Breakdown */}
              {preview.categoryBreakdown.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">카테고리별 요약</h3>
                  <div className="space-y-2">
                    {preview.categoryBreakdown.slice(0, 5).map((cat) => (
                      <div key={cat.category} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <span className="text-sm font-medium">
                            {CATEGORY_LABELS[cat.category] || cat.category}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({cat.count}개)
                          </span>
                        </div>
                        <span className="text-sm font-bold">
                          {formatCurrency(cat.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Download Options */}
          <Card>
            <CardHeader>
              <CardTitle>다운로드 (Download)</CardTitle>
              <CardDescription>
                회계사 제출용 파일을 다운로드하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={() => handleDownload('excel')}
                  disabled={downloading}
                  size="lg"
                  className="w-full"
                >
                  📊 Excel (.xlsx) 다운로드
                </Button>
                <Button
                  onClick={() => handleDownload('csv')}
                  disabled={downloading}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  📄 CSV 다운로드
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Excel 파일에는 요약 정보와 거래내역이 모두 포함됩니다
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

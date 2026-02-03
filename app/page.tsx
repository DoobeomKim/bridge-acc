'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils-accounting'
import { CATEGORY_LABELS } from '@/types'

interface DashboardData {
  summary: {
    totalIncome: number
    totalExpense: number
    netIncome: number
    vatPayable: number
  }
  categoryBreakdown: {
    category: string
    amount: number
    count: number
  }[]
  recentTransactions: {
    id: string
    date: string
    amount: number
    currency: string
    description: string
    counterparty: string | null
    category: string | null
  }[]
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>데이터를 불러올 수 없습니다</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          독일 GmbH 회계 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 수입</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.summary.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Einnahmen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 지출</CardTitle>
            <span className="text-2xl">💸</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.summary.totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ausgaben
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">순이익</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.summary.netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Nettogewinn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VAT 납부 예정</CardTitle>
            <span className="text-2xl">🏛️</span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.summary.vatPayable >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {formatCurrency(data.summary.vatPayable)}
            </div>
            <p className="text-xs text-muted-foreground">
              MwSt
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 지출 (Top 10)</CardTitle>
            <CardDescription>
              이번 달 카테고리별 금액
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.categoryBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                데이터가 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                {data.categoryBreakdown.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.count}개 거래
                      </p>
                    </div>
                    <div className="text-sm font-bold">
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>최근 거래내역</CardTitle>
                <CardDescription>
                  최근 10개 거래
                </CardDescription>
              </div>
              <Link href="/transactions">
                <Button variant="outline" size="sm">
                  전체 보기
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  거래내역이 없습니다
                </p>
                <Link href="/transactions">
                  <Button>CSV 업로드하기</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate max-w-xs">
                        {tx.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.date)}
                        {tx.counterparty && ` • ${tx.counterparty}`}
                      </p>
                    </div>
                    <div className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
          <CardDescription>
            자주 사용하는 기능에 빠르게 접근하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/customers/new">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <span className="text-2xl">👥</span>
                <span className="text-sm">고객 추가</span>
              </Button>
            </Link>
            <Link href="/quotes/new">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <span className="text-2xl">📝</span>
                <span className="text-sm">견적서 작성</span>
              </Button>
            </Link>
            <Link href="/transactions">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <span className="text-2xl">📤</span>
                <span className="text-sm">CSV 업로드</span>
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <span className="text-2xl">📈</span>
                <span className="text-sm">리포트 생성</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

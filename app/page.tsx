'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, Wallet, Landmark,
  ArrowRight, UserPlus, FileText, Upload, BarChart3,
  ChevronLeft, ChevronRight, CalendarDays,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils-accounting'
import { CATEGORY_LABELS } from '@/types'
import { format, addMonths, subMonths, startOfMonth } from 'date-fns'

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

function SkeletonPulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded bg-zinc-100 ${className ?? ''}`} style={style} />
}

function KPICardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <SkeletonPulse className="h-2.5 w-20 mb-4" />
      <SkeletonPulse className="h-7 w-32 mb-2" />
      <SkeletonPulse className="h-2.5 w-14" />
    </div>
  )
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))

  useEffect(() => {
    fetchDashboardData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth])

  async function fetchDashboardData() {
    setLoading(true)
    try {
      const monthParam = format(currentMonth, 'yyyy-MM')
      const response = await fetch(`/api/dashboard?month=${monthParam}`)
      const result = await response.json()
      if (result.success) setData(result.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const isCurrentMonth = currentMonth >= startOfMonth(new Date())

  const kpiCards = [
    {
      title: '수입',
      subtitle: 'Einnahmen',
      value: data?.summary.totalIncome ?? 0,
      icon: TrendingUp,
      accent: 'bg-emerald-500',
      textColor: 'text-emerald-600',
    },
    {
      title: '지출',
      subtitle: 'Ausgaben',
      value: data?.summary.totalExpense ?? 0,
      icon: TrendingDown,
      accent: 'bg-red-400',
      textColor: 'text-red-500',
    },
    {
      title: '순이익',
      subtitle: 'Nettogewinn',
      value: data?.summary.netIncome ?? 0,
      icon: Wallet,
      accent: (data?.summary.netIncome ?? 0) >= 0 ? 'bg-emerald-500' : 'bg-red-400',
      textColor: (data?.summary.netIncome ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500',
    },
    {
      title: 'VAT 납부 예정',
      subtitle: 'Umsatzsteuer',
      value: data?.summary.vatPayable ?? 0,
      icon: Landmark,
      accent: 'bg-amber-400',
      textColor: 'text-amber-600',
    },
  ]

  const maxCategoryAmount = data?.categoryBreakdown[0]?.amount || 1

  const quickActions = [
    { label: '고객 추가', href: '/customers/new', icon: UserPlus },
    { label: '견적서 작성', href: '/quotes/new', icon: FileText },
    { label: '거래내역 업로드', href: '/transactions', icon: Upload },
    { label: '리포트 보기', href: '/reports', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-0.5">독일 GmbH 회계 현황</p>
          </div>

          {/* Month selector */}
          <div className="flex items-center bg-white border border-zinc-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              className="p-2 hover:bg-zinc-50 transition-colors border-r border-zinc-200"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-zinc-500" />
            </button>
            <div className="flex items-center gap-1.5 px-3 min-w-[116px] justify-center">
              <CalendarDays className="w-3 h-3 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-700">
                {format(currentMonth, 'yyyy년 M월')}
              </span>
            </div>
            <button
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              disabled={isCurrentMonth}
              className="p-2 hover:bg-zinc-50 transition-colors border-l border-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
            : kpiCards.map((card) => (
                <div key={card.title} className="bg-white rounded-xl border border-zinc-200 relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${card.accent}`} />
                  <div className="p-5 pl-5">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                        {card.title}
                      </p>
                      <card.icon className="w-3.5 h-3.5 text-zinc-300 mt-0.5" />
                    </div>
                    <p className={`text-2xl font-semibold tabular-nums ${card.textColor}`}>
                      {formatCurrency(card.value)}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1">{card.subtitle}</p>
                  </div>
                </div>
              ))}
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-2 gap-5">

          {/* Category Breakdown */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">카테고리별 지출</h2>
              <p className="text-xs text-zinc-400 mt-0.5">이번 달 상위 10개</p>
            </div>
            <div className="p-5">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <SkeletonPulse className="h-2.5 w-28" />
                      <SkeletonPulse className="h-1" style={{ width: `${75 - i * 12}%` }} />
                    </div>
                  ))}
                </div>
              ) : !data || data.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-8">데이터가 없습니다</p>
              ) : (
                <div className="space-y-3.5">
                  {data.categoryBreakdown.map((item) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-zinc-700">
                          {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] || item.category}
                        </span>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] text-zinc-400">{item.count}건</span>
                          <span className="text-xs font-semibold tabular-nums text-zinc-900">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-800 rounded-full"
                          style={{ width: `${(item.amount / maxCategoryAmount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">최근 거래내역</h2>
                <p className="text-xs text-zinc-400 mt-0.5">최근 10건</p>
              </div>
              <Link
                href="/transactions"
                className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                전체 보기 <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="p-5 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <SkeletonPulse className="h-2.5 w-40" />
                      <SkeletonPulse className="h-2 w-24" />
                    </div>
                    <SkeletonPulse className="h-2.5 w-20" />
                  </div>
                ))}
              </div>
            ) : !data || data.recentTransactions.length === 0 ? (
              <div className="text-center py-10 px-5">
                <p className="text-sm text-zinc-400 mb-4">거래내역이 없습니다</p>
                <Link
                  href="/transactions"
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-zinc-900 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  <Upload className="w-3 h-3" /> CSV 업로드
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {data.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50/70 transition-colors">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tx.amount > 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-800 truncate">{tx.description}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {formatDate(tx.date)}{tx.counterparty && ` · ${tx.counterparty}`}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold tabular-nums flex-shrink-0 ${tx.amount > 0 ? 'text-emerald-600' : 'text-zinc-500'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-4">빠른 작업</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all group"
              >
                <action.icon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors flex-shrink-0" />
                <span className="text-sm font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  FileText,
  Lightbulb,
  Network,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Wallet,
  Zap,
} from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth } from 'date-fns'
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

function SkeletonPulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded bg-cyan-200/10 ${className ?? ''}`} style={style} />
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-cyan-300/15 bg-slate-950/62 shadow-[0_0_34px_rgba(8,145,178,0.12)] backdrop-blur ${className}`}>
      <div className="flex items-start justify-between gap-4 border-b border-cyan-300/10 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-50 sm:text-base">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
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
  const summary = data?.summary
  const netIncome = summary?.netIncome ?? 0
  const unclassifiedCount = data?.recentTransactions.filter((tx) => !tx.category).length ?? 0
  const maxCategoryAmount = data?.categoryBreakdown[0]?.amount || 1

  const kpiStrip = [
    {
      title: 'Total Revenue',
      subtitle: 'MTD',
      value: summary ? formatCurrency(summary.totalIncome) : '...',
      trend: summary && summary.totalIncome > 0 ? 'Live finance data' : 'Waiting data',
      icon: TrendingUp,
      color: 'text-cyan-200',
      line: 'from-cyan-400 to-blue-500',
      mini: 'bg-[linear-gradient(135deg,transparent_0_15%,rgba(34,211,238,0.45)_15%_17%,transparent_17%_35%,rgba(59,130,246,0.5)_35%_38%,transparent_38%_58%,rgba(34,211,238,0.55)_58%_61%,transparent_61%)]',
    },
    {
      title: 'Active Projects',
      subtitle: 'MVP shell',
      value: '6',
      trend: '2 design tracks',
      icon: BriefcaseBusiness,
      color: 'text-blue-200',
      line: 'from-blue-400 to-indigo-500',
      mini: 'bg-[linear-gradient(135deg,transparent_0_20%,rgba(96,165,250,0.5)_20%_23%,transparent_23%_42%,rgba(129,140,248,0.45)_42%_45%,transparent_45%_65%)]',
    },
    {
      title: 'Open Quests',
      subtitle: 'Company ops',
      value: String(28 + unclassifiedCount),
      trend: unclassifiedCount > 0 ? `${unclassifiedCount} finance cleanup` : 'Stable queue',
      icon: Target,
      color: 'text-amber-200',
      line: 'from-amber-300 to-orange-500',
      mini: 'bg-[linear-gradient(135deg,transparent_0_18%,rgba(251,191,36,0.55)_18%_21%,transparent_21%_39%,rgba(249,115,22,0.48)_39%_42%,transparent_42%_68%)]',
    },
    {
      title: 'Cash Flow',
      subtitle: 'Current month',
      value: summary ? formatCurrency(netIncome) : '...',
      trend: netIncome >= 0 ? 'Healthy' : 'Needs review',
      icon: Wallet,
      color: netIncome >= 0 ? 'text-emerald-200' : 'text-rose-200',
      line: netIncome >= 0 ? 'from-emerald-300 to-teal-500' : 'from-rose-400 to-orange-400',
      mini: 'bg-[linear-gradient(135deg,transparent_0_16%,rgba(52,211,153,0.5)_16%_19%,transparent_19%_43%,rgba(45,212,191,0.5)_43%_46%,transparent_46%_70%)]',
    },
    {
      title: 'System Energy',
      subtitle: 'Operating health',
      value: '74%',
      trend: 'Good',
      icon: Zap,
      color: 'text-violet-200',
      line: 'from-violet-400 to-fuchsia-500',
      mini: 'bg-[linear-gradient(135deg,transparent_0_20%,rgba(167,139,250,0.5)_20%_24%,transparent_24%_48%,rgba(217,70,239,0.48)_48%_51%,transparent_51%_72%)]',
    },
  ]

  const briefing = useMemo(() => [
    {
      title: '오늘 가장 중요한 결정',
      icon: Brain,
      color: 'border-violet-300/20 bg-violet-400/10 text-violet-200',
      items: ['메세 영업 타임라인 확보', 'AI OS 메인 구조 승인'],
    },
    {
      title: '오늘 해야 할 3가지',
      icon: CheckCircle2,
      color: 'border-blue-300/20 bg-blue-400/10 text-blue-200',
      items: ['Anuga 영업 리스트 확장', 'Fairtale 랜딩페이지 점검', '인보이스 및 현금흐름 확인'],
    },
    {
      title: '위험 신호',
      icon: ShieldAlert,
      color: 'border-amber-300/20 bg-amber-400/10 text-amber-200',
      items: [
        unclassifiedCount > 0 ? `미분류 거래 ${unclassifiedCount}건` : '거래 분류 양호',
        (summary?.vatPayable ?? 0) > 0 ? 'VAT 납부 예정액 확인' : 'VAT 신호 낮음',
      ],
    },
    {
      title: 'AI 추천 행동',
      icon: Sparkles,
      color: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200',
      items: ['매출 연결 작업 먼저 처리', '막힌 퀘스트를 오른쪽 보드로 이동'],
    },
  ], [summary?.vatPayable, unclassifiedCount])

  const agents = [
    { no: '01', name: 'Production Guild', role: '제작팀', lv: 24, rate: 78, color: 'violet', quest: 'Fairtale 랜딩페이지 최종 편집', blocker: '클라이언트 피드백 대기', next: '피드백 반영 후 최종 내보내기' },
    { no: '02', name: 'Strategy & Planning', role: '기획 / PM', lv: 21, rate: 64, color: 'blue', quest: '2분기 프로젝트 포트폴리오 재정비', blocker: '우선순위 확정 대기', next: '전략 시나리오 A/B 제안' },
    { no: '03', name: 'Marketing & Sales', role: '영업 / 브랜딩', lv: 23, rate: 72, color: 'teal', quest: 'Anuga 참가 기업 리스트업', blocker: '일부 타깃 이메일 수신거부', next: '타깃 50개 추가 발굴' },
    { no: '04', name: 'Finance & Admin', role: '재무 / 운영', lv: 20, rate: 68, color: 'amber', quest: '인보이스 발행 및 현금흐름 점검', blocker: '미수금 2건 입금 지연', next: '미수금 고객 리마인드 발송' },
    { no: '05', name: 'Network & Partnership', role: '외부 협력', lv: 18, rate: 60, color: 'yellow', quest: '메세 & Anuga 파트너 미팅 세팅', blocker: '파트너사 응답 지연', next: '후속 미팅 일정 제안' },
    { no: '06', name: 'R&D / AI System', role: '연구개발', lv: 19, rate: 55, color: 'green', quest: '내부 자동화 툴 메타 테스트', blocker: '테스트 데이터 부족', next: '퀘스트 케이스 확대' },
    { no: '07', name: 'Culture & Team Care', role: '문화 / 관리', lv: 17, rate: 62, color: 'pink', quest: '팀 루틴 개선 & 회고 문화 강화', blocker: '팀원 참여도 편차', next: '익명 피드백 수집 진행' },
  ]

  const urgentIssues = [
    { title: 'Anuga 참가 영업 리스트 마감 임박', owner: 'Marketing AI', due: 'D-1' },
    { title: 'Fairtale 랜딩페이지 피드백 대기', owner: 'Production AI', due: 'D-2' },
    { title: '이번 달 인보이스 후속 확인', owner: 'Finance AI', due: 'D-1' },
  ]

  const schedule = [
    { time: '11:00', title: 'Weekly Strategy Meeting', owner: 'CEO, All AI Agents' },
    { time: '14:00', title: 'Project Review', owner: 'Production AI' },
    { time: '16:00', title: 'Campaign Check-in', owner: 'Marketing AI' },
  ]

  const quests = [
    { title: 'Fairtale 랜딩페이지 완성', dept: 'Production', status: '진행', date: '05.30', color: 'violet' },
    { title: '루에랑 팝업 제안서', dept: 'Strategy', status: '위험', date: '05.29', color: 'blue' },
    { title: 'Anuga 참가 기업 리스트 50개', dept: 'Marketing', status: '진행', date: '05.28', color: 'teal' },
    { title: '5월 인보이스 정리', dept: 'Finance', status: '위험', date: '05.28', color: 'amber' },
    { title: '메세 영업 메시지 발송', dept: 'Marketing', status: '진행', date: '05.29', color: 'blue' },
  ]

  const memories = [
    { title: 'Anuga 2025 참가 기획 회의록', date: '2025.05.28 10:15' },
    { title: '루에랑 팝업 프로젝트 브리핑', date: '2025.05.27 15:40' },
    { title: 'Fairtale 랜딩페이지 피드백', date: '2025.05.27 11:20' },
    { title: '5월 재무 현황 체크', date: '2025.05.26 18:30' },
  ]

  const colorMap: Record<string, string> = {
    violet: 'border-violet-300/20 bg-violet-400/10 text-violet-200',
    blue: 'border-blue-300/20 bg-blue-400/10 text-blue-200',
    teal: 'border-teal-300/20 bg-teal-400/10 text-teal-200',
    amber: 'border-amber-300/20 bg-amber-400/10 text-amber-200',
    yellow: 'border-yellow-300/20 bg-yellow-400/10 text-yellow-200',
    green: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200',
    pink: 'border-pink-300/20 bg-pink-400/10 text-pink-200',
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_48%_0%,rgba(37,99,235,0.24),transparent_32%),radial-gradient(circle_at_90%_78%,rgba(168,85,247,0.13),transparent_26%),#050912]">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(103,232,249,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative mx-auto w-full max-w-[1880px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="mb-5 flex flex-col gap-4 border-b border-cyan-300/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500">›</span>
              <h1 className="text-2xl font-semibold uppercase tracking-tight text-white sm:text-3xl">Command Center</h1>
              <span className="text-sm text-slate-500">Company at a Glance</span>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              회사 전체 상황을 보고, Finance 데이터를 실제 신호로 쓰며, 부서 AI와 퀘스트를 한 화면에서 조율합니다.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto">
            <div className="flex items-center overflow-hidden rounded-2xl border border-cyan-300/15 bg-slate-950/70">
              <button
                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                className="grid h-11 w-11 place-items-center border-r border-cyan-300/10 text-slate-400 transition-colors hover:bg-cyan-300/5 hover:text-cyan-100"
                aria-label="이전 달"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex h-11 min-w-[136px] items-center justify-center gap-2 px-3">
                <CalendarDays className="h-3.5 w-3.5 text-cyan-300/70" />
                <span className="text-xs font-medium text-slate-200">{format(currentMonth, 'yyyy년 M월')}</span>
              </div>
              <button
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                disabled={isCurrentMonth}
                className="grid h-11 w-11 place-items-center border-l border-cyan-300/10 text-slate-400 transition-colors hover:bg-cyan-300/5 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="다음 달"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Link
              href="/transactions"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 text-sm font-medium text-cyan-50 transition-colors hover:bg-cyan-300/20"
            >
              <Upload className="h-4 w-4" />
              거래 입력
            </Link>
          </div>
        </header>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {kpiStrip.map((kpi) => (
            <div key={kpi.title} className="group relative overflow-hidden rounded-2xl border border-cyan-300/12 bg-slate-950/65 p-4 shadow-[0_0_26px_rgba(8,145,178,0.1)]">
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${kpi.line}`} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{kpi.title}</p>
                  <p className="mt-1 text-[10px] text-slate-600">{kpi.subtitle}</p>
                </div>
                <kpi.icon className={`h-4 w-4 flex-shrink-0 ${kpi.color}`} />
              </div>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className={`text-2xl font-semibold tabular-nums ${kpi.color}`}>{loading ? '...' : kpi.value}</p>
                  <p className="mt-1 text-xs text-emerald-300/80">▲ {kpi.trend}</p>
                </div>
                <div className={`h-9 w-24 rounded opacity-80 ${kpi.mini}`} />
              </div>
            </div>
          ))}
        </section>

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-5">
            <Panel title="AI CEO Briefing" subtitle="Today's Key Briefing">
              <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4 sm:p-5">
                {briefing.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-cyan-300/10 bg-slate-950/58 p-4">
                    <div className={`mb-4 grid h-11 w-11 place-items-center rounded-2xl border ${item.color}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <ul className="mt-3 space-y-2">
                      {item.items.map((entry) => (
                        <li key={entry} className="flex gap-2 text-xs leading-5 text-slate-400">
                          <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-current" />
                          <span>{entry}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title="AI Agents"
              subtitle="7 Department Agents"
              action={<span className="hidden items-center gap-1 text-xs text-cyan-200/80 sm:flex">전체 에이전트 보기 <ArrowRight className="h-3 w-3" /></span>}
            >
              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 sm:p-5">
                {agents.map((agent) => (
                  <article key={agent.no} className="relative min-h-[290px] overflow-hidden rounded-2xl border border-cyan-300/12 bg-slate-950/70 p-4">
                    <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${agent.color === 'amber' ? 'from-amber-300 to-orange-500' : agent.color === 'teal' ? 'from-teal-300 to-cyan-500' : agent.color === 'green' ? 'from-emerald-300 to-lime-500' : agent.color === 'pink' ? 'from-pink-300 to-fuchsia-500' : agent.color === 'yellow' ? 'from-yellow-300 to-amber-500' : agent.color === 'blue' ? 'from-blue-300 to-indigo-500' : 'from-violet-300 to-purple-500'}`} />
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className={`grid h-11 w-11 place-items-center rounded-2xl border ${colorMap[agent.color]}`}>
                        <Brain className="h-5 w-5" />
                      </div>
                      <span className={`text-sm font-semibold ${colorMap[agent.color].split(' ')[2]}`}>{agent.no}</span>
                    </div>
                    <h3 className="text-base font-semibold uppercase leading-tight text-white">{agent.name}</h3>
                    <p className="mt-1 text-[11px] text-slate-500">{agent.role}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-600">LV.</p>
                        <p className="text-sm font-semibold text-slate-300">{agent.lv}</p>
                      </div>
                      <div className={`grid h-14 w-14 place-items-center rounded-full border ${colorMap[agent.color]}`}>
                        <span className="text-xs font-semibold">{agent.rate}%</span>
                      </div>
                    </div>
                    <div className="mt-5 space-y-3 text-xs">
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-200/70">현재 퀘스트</p>
                        <p className="leading-5 text-slate-300">{agent.quest}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-rose-200/70">막힌 것</p>
                        <p className="leading-5 text-slate-400">{agent.blocker}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-200/70">다음 액션</p>
                        <p className="leading-5 text-slate-400">{agent.next}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </Panel>

            <div className="grid gap-5 xl:grid-cols-4">
              <Panel title="Weekly Overview" subtitle="This Week" className="xl:col-span-1">
                <div className="p-5">
                  <div className="mx-auto grid aspect-square max-w-[220px] place-items-center rounded-full border border-violet-300/20 bg-violet-400/5">
                    <div className="grid h-[72%] w-[72%] place-items-center rounded-full border border-violet-300/25 bg-violet-400/10">
                      <div className="h-[58%] w-[58%] rounded-[34%] border border-violet-300/70 bg-violet-500/12 shadow-[0_0_32px_rgba(139,92,246,0.24)]" />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                    {['Production 75%', 'Strategy 68%', 'Marketing 72%', 'Finance 64%', 'R&D 58%', 'Culture 70%'].map((item) => <span key={item}>{item}</span>)}
                  </div>
                </div>
              </Panel>

              <Panel title="AI Insights" subtitle="AI가 발견한 인사이트" className="xl:col-span-1">
                <div className="space-y-3 p-5">
                  {[
                    '영업 파이프라인 부족이 다음 달 리스크가 될 수 있습니다.',
                    'Fairtale 프로젝트는 진행 상태가 안정적입니다.',
                    '현금 유입이 월초에 집중될 예정입니다.',
                  ].map((insight, index) => (
                    <div key={insight} className="flex gap-3 rounded-2xl border border-cyan-300/10 bg-slate-950/55 p-3">
                      <div className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl ${index === 0 ? 'bg-blue-400/15 text-blue-200' : 'bg-emerald-400/15 text-emerald-200'}`}>
                        <Lightbulb className="h-4 w-4" />
                      </div>
                      <p className="text-xs leading-5 text-slate-400">{insight}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Recent Memories" subtitle="최근 저장된 메모" className="xl:col-span-1">
                <div className="divide-y divide-cyan-300/10">
                  {memories.map((memory) => (
                    <div key={memory.title} className="flex items-center gap-3 px-5 py-3">
                      <FileText className="h-4 w-4 flex-shrink-0 text-amber-200/80" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-300">{memory.title}</p>
                        <p className="mt-1 text-[11px] text-slate-600">{memory.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Quick Input" subtitle="빠른 메모 / 아이디어 입력" className="xl:col-span-1">
                <div className="p-5">
                  <div className="mb-3 min-h-28 rounded-2xl border border-cyan-300/15 bg-slate-950/70 p-4 text-sm text-slate-500">
                    메모, 회의 내용, 아이디어를 입력하세요... AI가 자동으로 정리해 드립니다.
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '메모 추가', icon: FilePlus2 },
                      { label: '회의록 추가', icon: CalendarDays },
                      { label: '아이디어 추가', icon: Lightbulb },
                      { label: '파일 업로드', icon: Upload },
                    ].map((action) => (
                      <button key={action.label} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-cyan-300/12 bg-cyan-300/[0.04] px-3 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-300/25 hover:text-cyan-100">
                        <action.icon className="h-4 w-4 text-cyan-200/70" />
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Panel>
            </div>
          </main>

          <aside className="space-y-5">
            <Panel title="Urgent Issues" action={<span className="rounded-full bg-rose-400/15 px-2.5 py-1 text-xs font-semibold text-rose-200">{urgentIssues.length}</span>}>
              <div className="divide-y divide-rose-300/10">
                {urgentIssues.map((issue) => (
                  <div key={issue.title} className="flex gap-3 px-5 py-4">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-300" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-5 text-slate-200">{issue.title}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{issue.owner} · {issue.due}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Today's Schedule">
              <div className="divide-y divide-cyan-300/10">
                {schedule.map((item) => (
                  <div key={`${item.time}-${item.title}`} className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 px-5 py-4">
                    <span className="text-xs font-semibold tabular-nums text-slate-300">{item.time}</span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-200">{item.title}</p>
                      <p className="mt-1 truncate text-[11px] text-slate-500">{item.owner}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <button className="w-full rounded-xl border border-cyan-300/10 bg-cyan-300/[0.03] px-3 py-2 text-xs font-medium text-slate-400">전체 일정 보기 →</button>
              </div>
            </Panel>

            <Panel title="Quest Board">
              <div className="flex gap-2 px-5 py-4 text-[11px]">
                <span className="rounded-full bg-violet-400/15 px-2.5 py-1 text-violet-200">전체 28</span>
                <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-cyan-200">진행 12</span>
                <span className="rounded-full bg-rose-400/10 px-2.5 py-1 text-rose-200">막힘 4</span>
              </div>
              <div className="divide-y divide-cyan-300/10">
                {quests.map((quest) => (
                  <div key={quest.title} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${quest.color === 'amber' ? 'bg-amber-300' : quest.color === 'teal' ? 'bg-teal-300' : quest.color === 'blue' ? 'bg-blue-300' : 'bg-violet-300'}`} />
                        <p className="truncate text-xs font-medium text-slate-300">{quest.title}</p>
                      </div>
                      <p className="mt-1 pl-4 text-[11px] text-slate-600">{quest.status} · {quest.date}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[10px] ${colorMap[quest.color]}`}>{quest.dept}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <button className="w-full rounded-xl border border-cyan-300/10 bg-cyan-300/[0.03] px-3 py-2 text-xs font-medium text-slate-400">모든 퀘스트 보기 →</button>
              </div>
            </Panel>

            <Panel title="Finance Detail" subtitle="기존 회계 데이터">
              <div className="space-y-4 p-5">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonPulse key={i} className="h-8" />)
                ) : data && data.categoryBreakdown.length > 0 ? (
                  data.categoryBreakdown.slice(0, 4).map((item) => (
                    <div key={item.category}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="truncate text-xs font-medium text-slate-300">
                          {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] || item.category}
                        </span>
                        <span className="flex-shrink-0 text-xs font-semibold tabular-nums text-slate-100">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" style={{ width: `${(item.amount / maxCategoryAmount) * 100}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">데이터가 없습니다</p>
                )}
                <Link href="/reports" className="inline-flex items-center gap-1 text-xs text-cyan-200/80 hover:text-cyan-100">
                  리포트 보기 <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </Panel>

            <Panel title="Transaction Stream">
              {loading ? (
                <div className="space-y-4 p-5">
                  {Array.from({ length: 5 }).map((_, i) => <SkeletonPulse key={i} className="h-10" />)}
                </div>
              ) : !data || data.recentTransactions.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="mb-4 text-sm text-slate-500">거래내역이 없습니다</p>
                  <Link href="/transactions" className="inline-flex items-center gap-2 rounded-xl bg-cyan-300/10 px-3 py-2 text-xs font-medium text-cyan-100">
                    <Upload className="h-3.5 w-3.5" />
                    CSV 업로드
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-cyan-300/10">
                  {data.recentTransactions.slice(0, 6).map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 px-5 py-3">
                      <div className={`h-2 w-2 flex-shrink-0 rounded-full ${tx.amount > 0 ? 'bg-emerald-300' : 'bg-rose-300'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-200">{tx.description}</p>
                        <p className="mt-1 truncate text-[11px] text-slate-500">
                          {formatDate(tx.date)}{tx.counterparty && ` · ${tx.counterparty}`}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 text-xs font-semibold tabular-nums ${tx.amount > 0 ? 'text-emerald-300' : 'text-slate-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowLeftRight,
  BarChart3,
  Brain,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Network,
  Receipt,
  Settings,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react'

const navigation = [
  { name: 'Command', description: '회사 운영판', href: '/', icon: LayoutDashboard },
  { name: 'Growth', description: '사업 가설과 영업', href: '/growth', icon: TrendingUp },
  { name: 'Finance', description: '재무 현황', href: '/reports', icon: BarChart3 },
  { name: 'Transactions', description: '거래 흐름', href: '/transactions', icon: ArrowLeftRight },
  { name: '팝업행사', description: '행사 비용', href: '/popup-events', icon: Store },
  { name: 'Clients', description: '고객 기억', href: '/customers', icon: Users },
  { name: 'Quotes', description: '제안 퀘스트', href: '/quotes', icon: FileText },
  { name: 'Invoices', description: '매출 파이프라인', href: '/invoices', icon: Receipt },
  { name: 'Approvals', description: '승인과 브리핑', href: '/approvals', icon: ShieldCheck },
  { name: 'Agents', description: '부서 AI', href: '/', icon: Brain },
  { name: 'Network', description: '파트너', href: '/', icon: Network },
  { name: 'Settings', description: '시스템 설정', href: '/settings', icon: Settings },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem('bridge-ai-os-sidebar')
    const nextCollapsed = saved === 'collapsed'
    setCollapsed(nextCollapsed)
    document.body.dataset.sidebar = nextCollapsed ? 'collapsed' : 'expanded'
  }, [])

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value
      window.localStorage.setItem('bridge-ai-os-sidebar', next ? 'collapsed' : 'expanded')
      document.body.dataset.sidebar = next ? 'collapsed' : 'expanded'
      return next
    })
  }

  if (pathname === '/login') return null

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-cyan-400/15 bg-[#050b14]/95 shadow-[0_0_40px_rgba(8,145,178,0.12)] backdrop-blur-xl transition-[width] duration-300 lg:flex lg:flex-col ${
          collapsed ? 'w-[86px]' : 'w-[292px]'
        }`}
      >
        <div className="flex h-full flex-col p-4">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3 border-b border-cyan-300/10 pb-5`}>
            <Link href="/" className={`flex min-w-0 items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl border border-cyan-300/35 bg-cyan-400/10 text-lg font-black text-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.24)]">
                B
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-white">BRIDGEMAKERS</p>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-cyan-200/55">AI Operating System</p>
                </div>
              )}
            </Link>

            {!collapsed && (
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="사이드바 접기"
                className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/15 text-cyan-100/70 transition-colors hover:border-cyan-300/35 hover:bg-cyan-300/10 hover:text-cyan-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="사이드바 펼치기"
              className="mx-auto mt-4 grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/15 text-cyan-100/70 transition-colors hover:border-cyan-300/35 hover:bg-cyan-300/10 hover:text-cyan-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          <nav className="mt-5 grid gap-1.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={`${item.name}-${item.href}`}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`group flex h-12 items-center rounded-2xl border text-sm font-medium transition-all ${
                    collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                  } ${
                    isActive
                      ? 'border-cyan-300/35 bg-gradient-to-r from-blue-600/55 to-cyan-400/10 text-white shadow-[0_0_24px_rgba(37,99,235,0.24)]'
                      : 'border-transparent text-slate-400 hover:border-cyan-300/15 hover:bg-cyan-300/5 hover:text-cyan-50'
                  }`}
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-cyan-200' : 'text-slate-500 group-hover:text-cyan-200'}`} />
                  {!collapsed && (
                    <span className="min-w-0">
                      <span className="block truncate">{item.name}</span>
                      <span className="block truncate text-[10px] font-normal text-slate-500 group-hover:text-cyan-100/55">{item.description}</span>
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto space-y-3">
            {!collapsed && (
              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  <p className="text-xs font-semibold text-cyan-50">System Status</p>
                </div>
                <div className="space-y-2 text-[11px] text-slate-400">
                  <div className="flex justify-between"><span>Finance Data</span><span className="text-emerald-300">Live</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-[82%] rounded-full bg-cyan-300" /></div>
                  <div className="flex justify-between"><span>AI OS Shell</span><span className="text-cyan-200">MVP</span></div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              title={collapsed ? '로그아웃' : undefined}
              className={`flex h-11 w-full items-center rounded-2xl border border-transparent text-sm font-medium text-slate-400 transition-colors hover:border-cyan-300/15 hover:bg-cyan-300/5 hover:text-cyan-50 ${
                collapsed ? 'justify-center' : 'gap-3 px-3'
              }`}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>로그아웃</span>}
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-cyan-300/10 bg-[#050b14]/92 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/35 bg-cyan-400/10 text-base font-black text-cyan-300">
              B
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-white">Bridge AI OS</p>
              <p className="text-[10px] uppercase tracking-wider text-cyan-200/55">Company Command</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 text-slate-300"
            aria-label="로그아웃"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-3">
          {navigation.slice(0, 7).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={`mobile-${item.name}-${item.href}`}
                href={item.href}
                className={`flex flex-shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                  isActive
                    ? 'border-cyan-300/35 bg-blue-600/40 text-white'
                    : 'border-cyan-300/10 text-slate-400'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </header>
    </>
  )
}

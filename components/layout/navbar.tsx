'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, Users, FileText,
  Receipt, BarChart3, Settings, LogOut,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard',   href: '/',             icon: LayoutDashboard },
  { name: '거래내역',    href: '/transactions',  icon: ArrowLeftRight },
  { name: '고객',        href: '/customers',     icon: Users },
  { name: '견적서',      href: '/quotes',        icon: FileText },
  { name: '인보이스',    href: '/invoices',      icon: Receipt },
  { name: '리포트',      href: '/reports',       icon: BarChart3 },
  { name: '설정',        href: '/settings',      icon: Settings },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === '/login') return null

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b border-zinc-200 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex h-14 items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-sm font-semibold text-zinc-900 tracking-tight">
              Bridge Acc
            </Link>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-900'
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:block">로그아웃</span>
          </button>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

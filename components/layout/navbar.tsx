'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: '거래내역 (Transaktionen)', href: '/transactions', icon: '💳' },
  { name: '고객 (Kunden)', href: '/customers', icon: '👥' },
  { name: '견적서 (Angebote)', href: '/quotes', icon: '📝' },
  { name: '인보이스 (Rechnungen)', href: '/invoices', icon: '📄' },
  { name: '리포트 (Berichte)', href: '/reports', icon: '📈' },
  { name: '설정 (Einstellungen)', href: '/settings', icon: '⚙️' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">Bridge Acc</span>
            </Link>

            <div className="hidden md:flex md:space-x-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              독일 GmbH 회계 관리
            </span>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden pb-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

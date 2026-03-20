'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, UserPlus, Trash2, ArrowRight } from 'lucide-react'

interface Customer {
  id: string
  customerNumber: string
  name: string
  email?: string
  phone?: string
  company?: string
  city?: string
  notes?: string
  _count?: {
    quotes: number
    invoices: number
  }
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${50 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/customers')
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data = await res.json()
      setCustomers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`정말 "${name}" 고객을 삭제하시겠습니까?`)) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete customer')
      }
      fetchCustomers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete customer')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">고객</h1>
            <p className="text-sm text-zinc-500 mt-0.5">고객 관리</p>
          </div>
          <Link
            href="/customers/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> 고객 추가
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {/* Toolbar */}
          <div className="px-5 py-3.5 border-b border-zinc-100">
            <p className="text-xs text-zinc-500">
              {loading ? '불러오는 중...' : (
                <>
                  <span className="font-medium text-zinc-900">{customers.length}</span>명
                </>
              )}
            </p>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">고객번호</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">이름</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">회사</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">이메일</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-400">견적서</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-400">인보이스</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16">
                    <div className="text-center">
                      <Users className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                      <p className="text-sm text-zinc-400">등록된 고객이 없습니다</p>
                      <Link
                        href="/customers/new"
                        className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium bg-zinc-900 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors"
                      >
                        <UserPlus className="w-3 h-3" /> 고객 추가
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-xs font-mono text-zinc-500">{customer.customerNumber}</span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-medium text-zinc-800">{customer.name}</p>
                      {customer.city && (
                        <p className="text-[11px] text-zinc-400 mt-0.5">{customer.city}</p>
                      )}
                      {customer.notes && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 italic truncate max-w-[200px]" title={customer.notes}>{customer.notes}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs text-zinc-500">{customer.company || <span className="text-zinc-300">—</span>}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs text-zinc-500">{customer.email || <span className="text-zinc-300">—</span>}</p>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-xs tabular-nums text-zinc-600">{customer._count?.quotes || 0}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-xs tabular-nums text-zinc-600">{customer._count?.invoices || 0}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                          title="보기"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(customer.id, customer.name)}
                          disabled={deletingId === customer.id}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

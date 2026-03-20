'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt, Plus, Trash2, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils-accounting'

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  customer: {
    name: string
    company?: string
  }
  subtotal: number
  totalVat: number
  totalGross: number
  invoiceDate: string
  dueDate: string
  createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  draft:     '초안',
  sent:      '발송됨',
  paid:      '결제됨',
  overdue:   '연체',
  cancelled: '취소됨',
}

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-zinc-100 text-zinc-500 border-zinc-200',
  sent:      'bg-amber-50 text-amber-700 border-amber-200',
  paid:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue:   'bg-red-50 text-red-600 border-red-200',
  cancelled: 'bg-zinc-100 text-zinc-400 border-zinc-200',
}

const FILTERS = ['all', 'draft', 'sent', 'paid', 'overdue'] as const
const FILTER_LABELS: Record<string, string> = {
  all: '전체', draft: '초안', sent: '발송됨', paid: '결제됨', overdue: '연체',
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/invoices')
      if (!res.ok) throw new Error('Failed to fetch invoices')
      const data = await res.json()
      setInvoices(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`정말 인보이스 "${invoiceNumber}"를 삭제하시겠습니까?`)) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete invoice')
      }
      fetchInvoices()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete invoice')
    } finally {
      setDeletingId(null)
    }
  }

  const getDisplayStatus = (invoice: Invoice) => {
    if (invoice.status === 'sent' && new Date(invoice.dueDate) < new Date()) return 'overdue'
    return invoice.status
  }

  const filteredInvoices = filter === 'all'
    ? invoices
    : invoices.filter((inv) => getDisplayStatus(inv) === filter)

  const countByStatus = (s: string) =>
    s === 'overdue'
      ? invoices.filter((inv) => getDisplayStatus(inv) === 'overdue').length
      : invoices.filter((inv) => inv.status === s).length

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">인보이스</h1>
            <p className="text-sm text-zinc-500 mt-0.5">인보이스 관리</p>
          </div>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> 새 인보이스
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
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
            <p className="text-xs text-zinc-500">
              {loading ? '불러오는 중...' : (
                <>
                  <span className="font-medium text-zinc-900">{filteredInvoices.length}</span>건
                  {invoices.filter((inv) => getDisplayStatus(inv) === 'overdue').length > 0 && (
                    <span className="ml-2 text-red-600 font-medium">
                      · 연체 {invoices.filter((inv) => getDisplayStatus(inv) === 'overdue').length}건
                    </span>
                  )}
                </>
              )}
            </p>
            <div className="flex items-center gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 h-7 text-xs font-medium rounded-md transition-colors ${
                    filter === f
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  {FILTER_LABELS[f]}
                  {f !== 'all' && (
                    <span className="ml-1 tabular-nums">({countByStatus(f)})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">번호</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">고객</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">상태</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-zinc-400">금액 (총액)</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">발행일</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">마감일</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16">
                    <div className="text-center">
                      <Receipt className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                      <p className="text-sm text-zinc-400">
                        {filter === 'all' ? '등록된 인보이스가 없습니다' : `"${FILTER_LABELS[filter]}" 상태의 인보이스가 없습니다`}
                      </p>
                      {filter === 'all' && (
                        <Link
                          href="/invoices/new"
                          className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium bg-zinc-900 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> 새 인보이스
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const displayStatus = getDisplayStatus(invoice)
                  const isOverdue = displayStatus === 'overdue'
                  return (
                    <tr
                      key={invoice.id}
                      className={`transition-colors ${isOverdue ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-zinc-50/70'}`}
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="text-xs font-mono text-zinc-700 hover:text-zinc-900 transition-colors"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs font-medium text-zinc-800">{invoice.customer.name}</p>
                        {invoice.customer.company && (
                          <p className="text-[11px] text-zinc-400 mt-0.5">{invoice.customer.company}</p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${STATUS_STYLES[displayStatus] || STATUS_STYLES.draft}`}>
                          {STATUS_LABELS[displayStatus] || displayStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-xs font-semibold tabular-nums text-zinc-800">
                          {formatCurrency(invoice.totalGross, 'EUR')}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-zinc-500 tabular-nums">
                          {new Date(invoice.invoiceDate).toLocaleDateString('de-DE')}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs tabular-nums ${isOverdue ? 'text-red-600 font-medium' : 'text-zinc-500'}`}>
                          {new Date(invoice.dueDate).toLocaleDateString('de-DE')}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                            title="보기"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          {invoice.status === 'draft' && (
                            <button
                              onClick={() => handleDelete(invoice.id, invoice.invoiceNumber)}
                              disabled={deletingId === invoice.id}
                              className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

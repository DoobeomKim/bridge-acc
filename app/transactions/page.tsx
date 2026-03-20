'use client'

import { useState, useEffect } from 'react'
import { CsvUpload } from '@/components/transactions/csv-upload'
import { SyncButton } from '@/components/transactions/sync-button'
import { TransactionTable } from '@/components/transactions/transaction-table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATEGORY_LABELS } from '@/types'
import { Search, X } from 'lucide-react'

interface Transaction {
  id: string
  date: string
  amount: number
  currency: string
  description: string
  counterparty: string | null
  category: string | null
  vatRate: number | null
  vatAmount: number | null
  notes: string | null
  attachments?: { id: string }[]
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [deduplicating, setDeduplicating] = useState(false)

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter)
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/transactions?${params.toString()}`)
      const data = await response.json()
      if (data.success) setTransactions(data.data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleReset = () => {
    setSearch('')
    setCategoryFilter('')
    setTypeFilter('')
    setStartDate('')
    setEndDate('')
    setTimeout(() => fetchTransactions(), 0)
  }

  const hasFilters = search || (categoryFilter && categoryFilter !== 'all') || (typeFilter && typeFilter !== 'all') || startDate || endDate

  const handleExportCSV = () => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter)
    if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter)
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    window.open(`/api/transactions/export?${params.toString()}`, '_blank')
  }

  const handleDownloadAttachments = () => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter)
    if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter)
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    window.open(`/api/transactions/download-attachments?${params.toString()}`, '_blank')
  }

  const handleDeduplicate = async () => {
    if (!confirm('중복된 거래내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return

    setDeduplicating(true)
    try {
      const response = await fetch('/api/transactions/deduplicate', { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        alert(`중복 삭제 완료!\n전체: ${data.data.total}개\n중복: ${data.data.duplicates}개\n남은 거래: ${data.data.remaining}개`)
        fetchTransactions()
      } else {
        alert(`오류: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deduplicating:', error)
      alert('중복 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeduplicating(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">거래내역</h1>
          <p className="text-sm text-zinc-500 mt-0.5">은행 거래내역 업로드 및 관리</p>
        </div>

        {/* Upload & Sync */}
        <div className="grid md:grid-cols-2 gap-4">
          <CsvUpload onUploadSuccess={fetchTransactions} />
          <SyncButton onSyncComplete={fetchTransactions} />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <Input
                placeholder="설명, 거래처, 메모 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTransactions()}
                className="pl-8 h-8 text-xs border-zinc-200 focus-visible:ring-zinc-900"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[120px] h-8 text-xs border-zinc-200">
                <SelectValue placeholder="유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="income">수입</SelectItem>
                <SelectItem value="expense">지출</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs border-zinc-200">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[140px] h-8 text-xs border-zinc-200"
            />
            <span className="text-xs text-zinc-400">~</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[140px] h-8 text-xs border-zinc-200"
            />

            <button
              onClick={fetchTransactions}
              className="px-3 h-8 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-700 transition-colors"
            >
              검색
            </button>

            {hasFilters && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-3 h-8 border border-zinc-200 text-zinc-500 text-xs font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all"
              >
                <X className="w-3 h-3" /> 초기화
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <TransactionTable
            transactions={transactions}
            loading={loading}
            onTransactionUpdated={fetchTransactions}
            onDeleteDuplicates={handleDeduplicate}
            deletingDuplicates={deduplicating}
            onExportCSV={handleExportCSV}
            onDownloadAttachments={handleDownloadAttachments}
          />
        </div>

      </div>
    </div>
  )
}

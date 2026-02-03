'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CsvUpload } from '@/components/transactions/csv-upload'
import { SyncButton } from '@/components/transactions/sync-button'
import { TransactionTable } from '@/components/transactions/transaction-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATEGORY_LABELS } from '@/types'

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

      if (data.success) {
        setTransactions(data.data)
      }
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

  const handleSearch = () => {
    fetchTransactions()
  }

  const handleReset = () => {
    setSearch('')
    setCategoryFilter('')
    setTypeFilter('')
    setStartDate('')
    setEndDate('')
    setTimeout(() => fetchTransactions(), 0)
  }

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
    if (!confirm('중복된 거래내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    setDeduplicating(true)
    try {
      const response = await fetch('/api/transactions/deduplicate', {
        method: 'DELETE',
      })
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
    <div className="container mx-auto p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">거래내역 (Transaktionen)</h1>
        <p className="text-muted-foreground">
          은행 거래내역을 업로드하고 관리하세요
        </p>
      </div>

      {/* API Sync */}
      <SyncButton onSyncComplete={fetchTransactions} />

      {/* CSV Upload */}
      <CsvUpload onUploadSuccess={fetchTransactions} />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>필터 및 검색</CardTitle>
          <CardDescription>
            거래내역을 검색하고 필터링하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="설명, 상대방, 메모로 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    }
                  }}
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="유형 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="income">수입만</SelectItem>
                  <SelectItem value="expense">지출만</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="카테고리 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleSearch}>검색</Button>
              <Button variant="outline" onClick={handleReset}>
                초기화
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  시작일
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  종료일
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>거래내역 목록</CardTitle>
          <CardDescription>
            총 {transactions.length}개의 거래
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">로딩 중...</p>
            </div>
          ) : (
            <TransactionTable
              transactions={transactions}
              onTransactionUpdated={fetchTransactions}
              onDeleteDuplicates={handleDeduplicate}
              deletingDuplicates={deduplicating}
              onExportCSV={handleExportCSV}
              onDownloadAttachments={handleDownloadAttachments}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils-accounting'
import { CATEGORY_LABELS } from '@/types'
import { TransactionEditDialog } from './transaction-edit-dialog'
import { AttachmentsDialog } from './attachments-dialog'
import { Pencil, Trash2, Paperclip, Download, FileDown, Copy, Upload } from 'lucide-react'

interface Transaction {
  id: string
  date: string | Date
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

interface TransactionTableProps {
  transactions: Transaction[]
  loading?: boolean
  onTransactionUpdated?: () => void
  onDeleteDuplicates?: () => void
  deletingDuplicates?: boolean
  onExportCSV?: () => void
  onDownloadAttachments?: () => void
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </TableCell>
      ))}
    </TableRow>
  )
}

export function TransactionTable({
  transactions,
  loading = false,
  onTransactionUpdated,
  onDeleteDuplicates,
  deletingDuplicates = false,
  onExportCSV,
  onDownloadAttachments,
}: TransactionTableProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [viewingAttachmentsId, setViewingAttachmentsId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingAll, setDeletingAll] = useState(false)

  const getDuplicates = () => {
    const duplicateMap = new Map<string, string[]>()
    transactions.forEach((transaction) => {
      const normalizedDate = new Date(transaction.date).toISOString().split('T')[0]
      const key = `${normalizedDate}|${transaction.amount}|${transaction.description}|${transaction.counterparty || ''}`
      if (!duplicateMap.has(key)) duplicateMap.set(key, [])
      duplicateMap.get(key)!.push(transaction.id)
    })
    const duplicateIds = new Set<string>()
    duplicateMap.forEach((ids) => {
      if (ids.length > 1) ids.forEach((id) => duplicateIds.add(id))
    })
    return duplicateIds
  }

  const duplicateIds = getDuplicates()

  const handleDelete = async (id: string) => {
    if (!confirm('이 거래를 삭제하시겠습니까?')) return
    setDeletingId(id)
    try {
      const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) onTransactionUpdated?.()
      else alert(`오류: ${data.error}`)
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteAll = async () => {
    const count = transactions.length
    if (count === 0) { alert('삭제할 거래가 없습니다.'); return }
    if (!confirm(`현재 표시된 ${count}개의 거래를 모두 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return

    setDeletingAll(true)
    try {
      let successCount = 0, errorCount = 0
      for (const transaction of transactions) {
        try {
          const response = await fetch(`/api/transactions/${transaction.id}`, { method: 'DELETE' })
          const data = await response.json()
          if (data.success) successCount++
          else errorCount++
        } catch {
          errorCount++
        }
      }
      alert(`삭제 완료!\n성공: ${successCount}개\n실패: ${errorCount}개`)
      onTransactionUpdated?.()
    } catch (error) {
      console.error('Error deleting all transactions:', error)
      alert('일괄 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingAll(false)
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
        <p className="text-xs text-zinc-500">
          {loading ? '불러오는 중...' : (
            <>
              <span className="font-medium text-zinc-900">{transactions.length}</span>건
              {duplicateIds.size > 0 && (
                <span className="ml-2 text-amber-600 font-medium">· 중복 의심 {duplicateIds.size}건</span>
              )}
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3 h-7 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all"
            >
              <FileDown className="w-3 h-3" /> CSV
            </button>
          )}
          {onDownloadAttachments && (
            <button
              onClick={onDownloadAttachments}
              className="flex items-center gap-1.5 px-3 h-7 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all"
            >
              <Download className="w-3 h-3" /> 첨부파일
            </button>
          )}
          {onDeleteDuplicates && (
            <button
              onClick={onDeleteDuplicates}
              disabled={deletingDuplicates}
              className="flex items-center gap-1.5 px-3 h-7 border border-amber-200 text-amber-700 text-xs font-medium rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all disabled:opacity-50"
            >
              <Copy className="w-3 h-3" /> {deletingDuplicates ? '처리 중...' : '중복 삭제'}
            </button>
          )}
          {transactions.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="flex items-center gap-1.5 px-3 h-7 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:border-red-400 hover:bg-red-50 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> {deletingAll ? '삭제 중...' : '전체 삭제'}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-zinc-100">
            <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 h-9">날짜</TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 h-9">설명</TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 h-9">거래처</TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 h-9 text-right">금액</TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 h-9">카테고리</TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 h-9">VAT</TableHead>
            <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 h-9 text-center">첨부</TableHead>
            <TableHead className="h-9" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-16">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400">거래내역이 없습니다</p>
                  <p className="text-xs text-zinc-300 mt-1">CSV 파일을 업로드하여 시작하세요</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => {
              const isDuplicate = duplicateIds.has(tx.id)
              return (
                <TableRow
                  key={tx.id}
                  className={`border-zinc-50 transition-colors ${isDuplicate ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-zinc-50/70'}`}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600 tabular-nums">{formatDate(tx.date)}</span>
                      {isDuplicate && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200">
                          중복?
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 max-w-[200px]">
                    <p className="text-xs font-medium text-zinc-800 truncate" title={tx.description}>
                      {tx.description}
                    </p>
                  </TableCell>
                  <TableCell className="py-3 max-w-[160px]">
                    <p className="text-xs text-zinc-500 truncate" title={tx.counterparty || '-'}>
                      {tx.counterparty || <span className="text-zinc-300">—</span>}
                    </p>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className={`text-xs font-semibold tabular-nums ${tx.amount > 0 ? 'text-emerald-600' : 'text-zinc-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    {tx.category ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {CATEGORY_LABELS[tx.category as keyof typeof CATEGORY_LABELS] || tx.category}
                      </span>
                    ) : (
                      <span className="text-zinc-300 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    {tx.vatRate !== null ? (
                      <div>
                        <span className="text-xs font-medium text-zinc-700">{tx.vatRate}%</span>
                        {tx.vatAmount !== null && (
                          <p className="text-[11px] text-zinc-400 tabular-nums">{formatCurrency(tx.vatAmount)}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-300 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    {tx.attachments && tx.attachments.length > 0 ? (
                      <button
                        onClick={() => setViewingAttachmentsId(tx.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors"
                      >
                        <Paperclip className="w-3 h-3 text-zinc-400" />
                        <span className="text-[11px] font-medium text-zinc-500">{tx.attachments.length}</span>
                      </button>
                    ) : (
                      <span className="text-zinc-200 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingTransaction(tx)}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                        title="편집"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {editingTransaction && (
        <TransactionEditDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => { if (!open) setEditingTransaction(null) }}
          onSaved={() => {
            setEditingTransaction(null)
            onTransactionUpdated?.()
          }}
        />
      )}

      {viewingAttachmentsId && (
        <AttachmentsDialog
          transactionId={viewingAttachmentsId}
          open={!!viewingAttachmentsId}
          onOpenChange={(open) => { if (!open) setViewingAttachmentsId(null) }}
        />
      )}
    </>
  )
}

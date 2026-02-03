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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils-accounting'
import { CATEGORY_LABELS } from '@/types'
import { TransactionEditDialog } from './transaction-edit-dialog'
import { AttachmentsDialog } from './attachments-dialog'

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
  onTransactionUpdated?: () => void
  onDeleteDuplicates?: () => void
  deletingDuplicates?: boolean
  onExportCSV?: () => void
  onDownloadAttachments?: () => void
}

export function TransactionTable({
  transactions,
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

  // 중복 의심 거래 감지
  const getDuplicates = () => {
    const duplicateMap = new Map<string, string[]>()

    transactions.forEach((transaction) => {
      const normalizedDate = new Date(transaction.date).toISOString().split('T')[0]
      const key = `${normalizedDate}|${transaction.amount}|${transaction.description}|${transaction.counterparty || ''}`

      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, [])
      }
      duplicateMap.get(key)!.push(transaction.id)
    })

    // 2개 이상인 것만 중복으로 간주
    const duplicateIds = new Set<string>()
    duplicateMap.forEach((ids) => {
      if (ids.length > 1) {
        ids.forEach((id) => duplicateIds.add(id))
      }
    })

    return duplicateIds
  }

  const duplicateIds = getDuplicates()

  const handleDelete = async (id: string) => {
    if (!confirm('이 거래를 삭제하시겠습니까?')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        if (onTransactionUpdated) {
          onTransactionUpdated()
        }
      } else {
        alert(`오류: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteAll = async () => {
    const count = transactions.length
    if (count === 0) {
      alert('삭제할 거래가 없습니다.')
      return
    }

    if (!confirm(`현재 표시된 ${count}개의 거래를 모두 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    setDeletingAll(true)
    try {
      // 모든 거래를 순차적으로 삭제
      let successCount = 0
      let errorCount = 0

      for (const transaction of transactions) {
        try {
          const response = await fetch(`/api/transactions/${transaction.id}`, {
            method: 'DELETE',
          })

          const data = await response.json()
          if (data.success) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          console.error(`Error deleting transaction ${transaction.id}:`, error)
          errorCount++
        }
      }

      alert(`삭제 완료!\n성공: ${successCount}개\n실패: ${errorCount}개`)

      if (onTransactionUpdated) {
        onTransactionUpdated()
      }
    } catch (error) {
      console.error('Error deleting all transactions:', error)
      alert('일괄 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingAll(false)
    }
  }

  const getAmountBadge = (amount: number) => {
    if (amount > 0) {
      return <Badge variant="default" className="bg-green-600">수입</Badge>
    } else {
      return <Badge variant="secondary">지출</Badge>
    }
  }

  const getCategoryLabel = (category: string | null) => {
    if (!category) return '-'
    return CATEGORY_LABELS[category] || category
  }

  return (
    <>
      {transactions.length > 0 && (
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            {transactions.length}개의 거래가 표시되고 있습니다
            {duplicateIds.size > 0 && (
              <span className="ml-2 text-yellow-600 font-medium">
                (중복 의심: {duplicateIds.size}개)
              </span>
            )}
          </p>
          <div className="flex gap-2">
            {onExportCSV && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportCSV}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                CSV 내보내기
              </Button>
            )}
            {onDownloadAttachments && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadAttachments}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                첨부파일 일괄 다운로드
              </Button>
            )}
            {onDeleteDuplicates && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDeleteDuplicates}
                disabled={deletingDuplicates}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                {deletingDuplicates ? '처리 중...' : '중복 거래 삭제'}
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAll}
              disabled={deletingAll}
            >
              {deletingAll ? '삭제 중...' : '표시된 모두 삭제'}
            </Button>
          </div>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>날짜</TableHead>
              <TableHead>설명 (Beschreibung)</TableHead>
              <TableHead>상대방 (Gegenpartei)</TableHead>
              <TableHead className="text-right">금액</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>VAT</TableHead>
              <TableHead className="text-center">첨부</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  거래내역이 없습니다. CSV 파일을 업로드하여 시작하세요.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => {
                const isDuplicate = duplicateIds.has(transaction.id)
                const rowClassName = isDuplicate ? 'bg-yellow-50 hover:bg-yellow-100' : ''

                return (
                  <TableRow key={transaction.id} className={rowClassName}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {formatDate(transaction.date)}
                        {isDuplicate && (
                          <Badge variant="outline" className="bg-yellow-200 text-yellow-800 border-yellow-300">
                            중복?
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={transaction.description}>
                      {transaction.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={transaction.counterparty || '-'}>
                      {transaction.counterparty || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span
                      className={
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </span>
                  </TableCell>
                  <TableCell>{getAmountBadge(transaction.amount)}</TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {getCategoryLabel(transaction.category)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {transaction.vatRate !== null ? (
                      <div className="text-sm">
                        <div>{transaction.vatRate}%</div>
                        {transaction.vatAmount !== null && (
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(transaction.vatAmount)}
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {transaction.attachments && transaction.attachments.length > 0 ? (
                      <button
                        onClick={() => setViewingAttachmentsId(transaction.id)}
                        className="flex items-center justify-center gap-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors cursor-pointer"
                        title="첨부파일 보기"
                      >
                        <span className="text-lg">📎</span>
                        <Badge variant="secondary" className="text-xs">
                          {transaction.attachments.length}
                        </Badge>
                      </button>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTransaction(transaction)}
                      >
                        편집
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(transaction.id)}
                        disabled={deletingId === transaction.id}
                      >
                        {deletingId === transaction.id ? '삭제 중...' : '삭제'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
            )}
          </TableBody>
        </Table>
      </div>

      {editingTransaction && (
        <TransactionEditDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => {
            if (!open) setEditingTransaction(null)
          }}
          onSaved={() => {
            setEditingTransaction(null)
            if (onTransactionUpdated) {
              onTransactionUpdated()
            }
          }}
        />
      )}

      {viewingAttachmentsId && (
        <AttachmentsDialog
          transactionId={viewingAttachmentsId}
          open={!!viewingAttachmentsId}
          onOpenChange={(open) => {
            if (!open) setViewingAttachmentsId(null)
          }}
        />
      )}
    </>
  )
}

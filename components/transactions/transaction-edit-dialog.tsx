'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TRANSACTION_CATEGORIES, CATEGORY_LABELS, VAT_RATES } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils-accounting'
import {
  Paperclip, Upload, Eye, Download, Trash2,
  FileText, ImageIcon, AlertCircle,
} from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Attachment = any

interface Transaction {
  id: string
  date: string | Date
  amount: number
  currency: string
  description: string
  counterparty: string | null
  category: string | null
  vatRate: number | null
  notes: string | null
}

interface TransactionEditDialogProps {
  transaction: Transaction
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function isViewable(mimeType: string) {
  return ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    .some(t => mimeType.toLowerCase().includes(t))
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-zinc-400" />
  return <FileText className="w-4 h-4 text-zinc-400" />
}

export function TransactionEditDialog({
  transaction,
  open,
  onOpenChange,
  onSaved,
}: TransactionEditDialogProps) {
  const [description, setDescription] = useState(transaction.description || '')
  const [category, setCategory] = useState(transaction.category || 'none')
  const [vatRate, setVatRate] = useState(
    transaction.vatRate !== null ? transaction.vatRate.toString() : 'none'
  )
  const [notes, setNotes] = useState(transaction.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const loadAttachments = async () => {
    setLoadingAttachments(true)
    try {
      const response = await fetch(`/api/transactions/${transaction.id}/attachments`)
      const data = await response.json()
      if (data.success) setAttachments(data.data)
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setLoadingAttachments(false)
    }
  }

  useEffect(() => {
    setDescription(transaction.description || '')
    setCategory(transaction.category || 'none')
    setVatRate(transaction.vatRate !== null ? transaction.vatRate.toString() : 'none')
    setNotes(transaction.notes || '')
    setError(null)
    loadAttachments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    setUploadingFiles(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append('files', file))
      const response = await fetch(`/api/transactions/${transaction.id}/attachments`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to upload files')
      await loadAttachments()
      event.target.value = ''
    } catch (err) {
      alert(err instanceof Error ? err.message : 'File upload failed')
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleFileDrop = async (files: FileList) => {
    if (!files || files.length === 0) return
    setUploadingFiles(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append('files', file))
      const response = await fetch(`/api/transactions/${transaction.id}/attachments`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to upload files')
      await loadAttachments()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'File upload failed')
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('이 파일을 삭제하시겠습니까?')) return
    try {
      const response = await fetch(
        `/api/transactions/${transaction.id}/attachments/${attachmentId}`,
        { method: 'DELETE' }
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to delete file')
      await loadAttachments()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'File deletion failed')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim() || '',
          category: category === 'none' ? null : category,
          vatRate: vatRate === 'none' ? null : parseFloat(vatRate),
          notes: notes || null,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to save')
      onSaved?.()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const incomeCategories = Object.entries(TRANSACTION_CATEGORIES)
    .filter(([, v]) => v.startsWith('revenue_'))
    .map(([, v]) => ({ value: v, label: CATEGORY_LABELS[v] }))

  const expenseCategories = Object.entries(TRANSACTION_CATEGORIES)
    .filter(([, v]) => v.startsWith('expense_'))
    .map(([, v]) => ({ value: v, label: CATEGORY_LABELS[v] }))

  const taxCategories = Object.entries(TRANSACTION_CATEGORIES)
    .filter(([, v]) => v.startsWith('tax_'))
    .map(([, v]) => ({ value: v, label: CATEGORY_LABELS[v] }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0">

        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-zinc-100">
          <DialogTitle className="text-sm font-semibold text-zinc-900">거래내역 편집</DialogTitle>
          <div className="flex items-center justify-between mt-3 p-3 bg-zinc-50 rounded-lg">
            <div>
              <p className="text-xs text-zinc-500">{formatDate(transaction.date)}</p>
              <p className="text-xs font-medium text-zinc-700 mt-0.5 truncate max-w-[280px]">
                {transaction.description}
              </p>
              {transaction.counterparty && (
                <p className="text-[11px] text-zinc-400 mt-0.5">{transaction.counterparty}</p>
              )}
            </div>
            <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ml-4 ${
              transaction.amount > 0 ? 'text-emerald-600' : 'text-zinc-700'
            }`}>
              {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount, transaction.currency)}
            </span>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              설명
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-xs border-zinc-200 resize-none focus-visible:ring-zinc-900"
              placeholder="거래 설명..."
            />
          </div>

          {/* Category + VAT row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                카테고리
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs border-zinc-200 focus:ring-zinc-900">
                  <SelectValue placeholder="미분류" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미분류</SelectItem>
                  {incomeCategories.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">수입</div>
                      {incomeCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </>
                  )}
                  {expenseCategories.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">지출</div>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </>
                  )}
                  {taxCategories.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">세금</div>
                      {taxCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                VAT (MwSt)
              </label>
              <Select value={vatRate} onValueChange={setVatRate}>
                <SelectTrigger className="h-8 text-xs border-zinc-200 focus:ring-zinc-900">
                  <SelectValue placeholder="해당 없음" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">해당 없음</SelectItem>
                  {VAT_RATES.map((rate) => (
                    <SelectItem key={rate} value={rate.toString()}>{rate}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              메모
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-xs border-zinc-200 resize-none focus-visible:ring-zinc-900"
              placeholder="추가 메모..."
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              증빙자료 · {attachments.length}개
            </label>

            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-lg transition-colors ${
                isDragging ? 'border-zinc-400 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'
              }`}
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const files = e.dataTransfer.files
                if (files?.length) handleFileDrop(files)
              }}
            >
              <label htmlFor="attachment-upload" className="flex items-center justify-center gap-2 py-3 cursor-pointer">
                <input
                  id="attachment-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                  disabled={uploadingFiles}
                  className="hidden"
                />
                {uploadingFiles ? (
                  <div className="flex items-center gap-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                    <span className="text-xs text-zinc-400">업로드 중...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs text-zinc-500">클릭 또는 드래그 · PDF, 이미지, Excel, Word</span>
                  </>
                )}
              </label>
            </div>

            {/* Attachment list */}
            {loadingAttachments ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-10 bg-zinc-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : attachments.length > 0 ? (
              <div className="space-y-1.5">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-3 px-3 py-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                    <FileIcon mimeType={att.mimeType} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-700 truncate">{att.fileName}</p>
                      <p className="text-[11px] text-zinc-400">{formatFileSize(att.fileSize)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {isViewable(att.mimeType) && (
                        <button
                          onClick={() => window.open(`/api/transactions/${transaction.id}/attachments/${att.id}/view`, '_blank')}
                          className="p-1.5 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
                          title="보기"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = `/api/transactions/${transaction.id}/attachments/${att.id}`
                          link.download = att.fileName
                          link.click()
                        }}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
                        title="다운로드"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="p-1.5 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 py-3 px-3">
                <Paperclip className="w-3.5 h-3.5 text-zinc-300" />
                <p className="text-xs text-zinc-400">첨부된 파일이 없습니다</p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="px-4 py-2 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>

      </DialogContent>
    </Dialog>
  )
}

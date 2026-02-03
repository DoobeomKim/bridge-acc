'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TRANSACTION_CATEGORIES, CATEGORY_LABELS, VAT_RATES } from '@/types'
import { formatCurrency } from '@/lib/utils-accounting'

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

export function TransactionEditDialog({
  transaction,
  open,
  onOpenChange,
  onSaved,
}: TransactionEditDialogProps) {
  const [description, setDescription] = useState<string>(transaction.description || '')
  const [category, setCategory] = useState<string>(transaction.category || 'none')
  const [vatRate, setVatRate] = useState<string>(
    transaction.vatRate !== null ? transaction.vatRate.toString() : 'none'
  )
  const [notes, setNotes] = useState<string>(transaction.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<any[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Load attachments
  const loadAttachments = async () => {
    setLoadingAttachments(true)
    try {
      const response = await fetch(`/api/transactions/${transaction.id}/attachments`)
      const data = await response.json()
      if (data.success) {
        setAttachments(data.data)
      }
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setLoadingAttachments(false)
    }
  }

  // Reset form when transaction changes
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
      Array.from(files).forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch(`/api/transactions/${transaction.id}/attachments`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload files')
      }

      await loadAttachments()
      event.target.value = '' // Reset input
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
      Array.from(files).forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch(`/api/transactions/${transaction.id}/attachments`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload files')
      }

      await loadAttachments()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'File upload failed')
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileDrop(files)
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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete file')
      }

      await loadAttachments()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'File deletion failed')
    }
  }

  const handleViewAttachment = (attachmentId: string, mimeType: string) => {
    // PDF와 이미지는 브라우저에서 직접 열기
    const viewableTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif']

    if (viewableTypes.some(type => mimeType.toLowerCase().includes(type))) {
      const url = `/api/transactions/${transaction.id}/attachments/${attachmentId}/view`
      window.open(url, '_blank')
    } else {
      alert('이 파일 형식은 브라우저에서 미리보기를 지원하지 않습니다. 다운로드하여 확인해주세요.')
    }
  }

  const handleDownloadAttachment = (attachmentId: string, fileName: string) => {
    const url = `/api/transactions/${transaction.id}/attachments/${attachmentId}`
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
  }

  const isViewable = (mimeType: string) => {
    const viewableTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    return viewableTypes.some(type => mimeType.toLowerCase().includes(type))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim() || '',
          category: category === 'none' ? null : category,
          vatRate: vatRate === 'none' ? null : parseFloat(vatRate),
          notes: notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      if (onSaved) {
        onSaved()
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  // 카테고리를 수입/지출로 그룹화
  const incomeCategories = Object.entries(TRANSACTION_CATEGORIES)
    .filter(([, value]) => value.startsWith('revenue_'))
    .map(([key, value]) => ({ key, value, label: CATEGORY_LABELS[value] }))

  const expenseCategories = Object.entries(TRANSACTION_CATEGORIES)
    .filter(([, value]) => value.startsWith('expense_'))
    .map(([key, value]) => ({ key, value, label: CATEGORY_LABELS[value] }))

  const taxCategories = Object.entries(TRANSACTION_CATEGORIES)
    .filter(([, value]) => value.startsWith('tax_'))
    .map(([key, value]) => ({ key, value, label: CATEGORY_LABELS[value] }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>거래내역 편집 (Transaktion bearbeiten)</DialogTitle>
          <DialogDescription>
            카테고리와 VAT 정보를 설정하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction details */}
          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">금액:</span>
              <span
                className={`text-sm font-bold ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(transaction.amount, transaction.currency)}
              </span>
            </div>
            {transaction.counterparty && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">상대방:</span>
                <span className="text-sm">{transaction.counterparty}</span>
              </div>
            )}
          </div>

          {/* Description input */}
          <div className="space-y-2">
            <Label htmlFor="description">설명 (Beschreibung)</Label>
            <Textarea
              id="description"
              placeholder="거래 설명을 입력하세요..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Category selection */}
          <div className="space-y-2">
            <Label htmlFor="category">카테고리 (Kategorie)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="카테고리 선택..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">미분류</SelectItem>

                {incomeCategories.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      수입 (Einnahmen)
                    </div>
                    {incomeCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </>
                )}

                {expenseCategories.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      지출 (Ausgaben)
                    </div>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </>
                )}

                {taxCategories.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      세금 (Steuern)
                    </div>
                    {taxCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* VAT rate selection */}
          <div className="space-y-2">
            <Label htmlFor="vatRate">VAT 세율 (MwSt-Satz)</Label>
            <Select value={vatRate} onValueChange={setVatRate}>
              <SelectTrigger id="vatRate">
                <SelectValue placeholder="VAT 세율 선택..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">해당 없음</SelectItem>
                {VAT_RATES.map((rate) => (
                  <SelectItem key={rate} value={rate.toString()}>
                    {rate}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {vatRate && vatRate !== 'none' && (
              <p className="text-xs text-muted-foreground">
                VAT 금액은 자동으로 계산됩니다
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">메모 (Notizen)</Label>
            <Textarea
              id="notes"
              placeholder="추가 정보나 메모를 입력하세요..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>증빙자료 (Belege)</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                isDragging
                  ? 'border-gray-600 bg-gray-50'
                  : 'border-gray-300 bg-white'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadingFiles}
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <div className="text-3xl mb-2">📎</div>
                <p className="text-sm font-medium text-center">
                  {uploadingFiles ? '업로드 중...' : '파일을 클릭하거나 드래그하여 업로드'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, 이미지, Excel, Word (최대 10MB)
                </p>
              </label>
            </div>

            {/* Attachments list */}
            {loadingAttachments ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-2xl">
                        {attachment.mimeType.startsWith('image/') ? '🖼️' :
                         attachment.mimeType === 'application/pdf' ? '📄' : '📎'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium break-words">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isViewable(attachment.mimeType) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAttachment(attachment.id, attachment.mimeType)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          보기
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadAttachment(attachment.id, attachment.fileName)}
                      >
                        다운로드
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                첨부된 파일이 없습니다
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

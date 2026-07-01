'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  POPUP_EXPENSE_CATEGORIES,
  POPUP_EXPENSE_CATEGORY_LABELS,
  POPUP_PAYMENT_METHOD_LABELS,
  VAT_RATES,
} from '@/types'
import { formatCurrency } from '@/lib/utils-accounting'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileDown,
  FileText,
  ImageIcon,
  Paperclip,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

interface PopupAttachment {
  id: string
  fileName?: string
  fileSize?: number
  mimeType?: string
}

interface PopupExpense {
  id: string
  date: string
  vendor: string
  itemName: string
  category: string | null
  grossAmount: number
  currency: string
  vatRate: number | null
  vatAmount: number | null
  paymentMethod: string | null
  status: string
  notes: string | null
  attachments: PopupAttachment[]
}

interface PopupEvent {
  id: string
  name: string
  description: string | null
  currency: string
  expenses: PopupExpense[]
}

interface ExpenseFormState {
  date: string
  vendor: string
  itemName: string
  category: string
  grossAmount: string
  vatRate: string
  paymentMethod: string
  status: string
  notes: string
}

const emptyForm = (): ExpenseFormState => ({
  date: new Date().toISOString().split('T')[0],
  vendor: '',
  itemName: '',
  category: 'other',
  grossAmount: '',
  vatRate: '19',
  paymentMethod: 'card',
  status: 'unchecked',
  notes: '',
})

function fileLabel(files: File[]) {
  if (files.length === 0) return 'PDF 또는 이미지 파일을 드래그하세요'
  if (files.length === 1) return files[0].name
  return `${files[0].name} 외 ${files.length - 1}개`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('de-DE')
}

function hasViewableMime(mimeType?: string) {
  if (!mimeType) return false
  return ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    .some((type) => mimeType.toLowerCase().includes(type))
}

function FileIcon({ mimeType }: { mimeType?: string }) {
  if (mimeType?.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-zinc-400" />
  return <FileText className="h-4 w-4 text-zinc-400" />
}

export default function PopupEventsPage() {
  const [event, setEvent] = useState<PopupEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [missingOnly, setMissingOnly] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<PopupExpense | null>(null)
  const [form, setForm] = useState<ExpenseFormState>(emptyForm)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [selectedPdfExpenseIds, setSelectedPdfExpenseIds] = useState<string[]>([])
  const [exportingPdf, setExportingPdf] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchEvent = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/popup-events')
      const data = await response.json()
      if (data.success) setEvent(data.data)
    } catch (error) {
      console.error('Error fetching popup event:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvent()
  }, [])

  const filteredExpenses = useMemo(() => {
    const expenses = event?.expenses || []
    return expenses.filter((expense) => {
      const matchesSearch = !search ||
        expense.vendor.toLowerCase().includes(search.toLowerCase()) ||
        expense.itemName.toLowerCase().includes(search.toLowerCase()) ||
        (expense.notes || '').toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
      const matchesMissing = !missingOnly || expense.attachments.length === 0
      return matchesSearch && matchesCategory && matchesMissing
    })
  }, [event, search, categoryFilter, missingOnly])

  const summary = useMemo(() => {
    const expenses = event?.expenses || []
    const totalGross = expenses.reduce((sum, expense) => sum + expense.grossAmount, 0)
    const totalVat = expenses.reduce((sum, expense) => sum + (expense.vatAmount || 0), 0)
    const missingAttachments = expenses.filter((expense) => expense.attachments.length === 0).length
    const unchecked = expenses.filter((expense) => expense.status !== 'checked').length
    const byCategory = expenses.reduce<Record<string, number>>((acc, expense) => {
      const key = expense.category || 'other'
      acc[key] = (acc[key] || 0) + expense.grossAmount
      return acc
    }, {})

    return {
      totalGross,
      totalVat,
      netCost: totalGross - totalVat,
      count: expenses.length,
      missingAttachments,
      unchecked,
      byCategory,
    }
  }, [event])

  const pdfCandidateExpenses = useMemo(() => {
    const expenses = event?.expenses || []
    return expenses
      .filter((expense) => categoryFilter === 'all' || expense.category === categoryFilter)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [event, categoryFilter])

  const selectedPdfExpenses = useMemo(() => {
    const selected = new Set(selectedPdfExpenseIds)
    return pdfCandidateExpenses.filter((expense) => selected.has(expense.id))
  }, [pdfCandidateExpenses, selectedPdfExpenseIds])

  const selectedPdfTotal = selectedPdfExpenses.reduce((sum, expense) => sum + expense.grossAmount, 0)

  const openCreateDialog = (files: File[] = []) => {
    setEditingExpense(null)
    setForm(emptyForm())
    setPendingFiles(files)
    setDialogOpen(true)
  }

  useEffect(() => {
    const handleNewShortcut = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key.toLowerCase() !== 'k' || (!keyboardEvent.metaKey && !keyboardEvent.ctrlKey)) return
      keyboardEvent.preventDefault()
      if (!dialogOpen) openCreateDialog()
    }

    window.addEventListener('keydown', handleNewShortcut)
    return () => window.removeEventListener('keydown', handleNewShortcut)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen])

  const openEditDialog = (expense: PopupExpense) => {
    setEditingExpense(expense)
    setForm({
      date: new Date(expense.date).toISOString().split('T')[0],
      vendor: expense.vendor,
      itemName: expense.itemName,
      category: expense.category || 'other',
      grossAmount: String(expense.grossAmount),
      vatRate: expense.vatRate !== null ? String(expense.vatRate) : 'none',
      paymentMethod: expense.paymentMethod || 'card',
      status: expense.status || 'unchecked',
      notes: expense.notes || '',
    })
    setPendingFiles([])
    setDialogOpen(true)
  }

  const addPendingFiles = (files: FileList | File[]) => {
    const nextFiles = Array.from(files).filter((file) =>
      ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
    )
    setPendingFiles((current) => [...current, ...nextFiles])
  }

  const handleTopDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    const files = Array.from(event.dataTransfer.files || [])
    if (files.length > 0) openCreateDialog(files)
  }

  const uploadFilesToExpense = async (expenseId: string, files: File[]) => {
    if (files.length === 0) return
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    const response = await fetch(`/api/popup-expenses/${expenseId}/attachments`, {
      method: 'POST',
      body: formData,
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || '첨부파일 업로드 실패')
  }

  const handleSave = async () => {
    if (!event) return
    setSaving(true)
    try {
      if (editingExpense) {
        const response = await fetch(`/api/popup-expenses/${editingExpense.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            category: form.category === 'none' ? null : form.category,
            vatRate: form.vatRate === 'none' ? null : form.vatRate,
            currency: event.currency,
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || '저장 실패')
        await uploadFilesToExpense(editingExpense.id, pendingFiles)
      } else {
        const formData = new FormData()
        Object.entries(form).forEach(([key, value]) => {
          if (key === 'vatRate' && value === 'none') return
          if (key === 'category' && value === 'none') return
          formData.append(key, value)
        })
        formData.append('currency', event.currency)
        pendingFiles.forEach((file) => formData.append('files', file))
        const response = await fetch(`/api/popup-events/${event.id}/expenses`, {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || '저장 실패')
      }

      setDialogOpen(false)
      await fetchEvent()
    } catch (error) {
      alert(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!dialogOpen) return

    const handleShortcut = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key !== 'Enter' || (!keyboardEvent.metaKey && !keyboardEvent.ctrlKey)) return
      keyboardEvent.preventDefault()
      if (!saving) handleSave()
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, saving, form, pendingFiles, editingExpense, event])

  const handleDelete = async (expense: PopupExpense) => {
    if (!confirm(`${expense.vendor} 내역을 삭제할까요?`)) return
    const response = await fetch(`/api/popup-expenses/${expense.id}`, { method: 'DELETE' })
    if (response.ok) fetchEvent()
  }

  const handleDeleteAttachment = async (expenseId: string, attachmentId: string) => {
    if (!confirm('이 첨부파일을 삭제할까요?')) return
    const response = await fetch(`/api/popup-expenses/${expenseId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    })
    if (response.ok) fetchEvent()
  }

  const openPdfDialog = () => {
    setSelectedPdfExpenseIds(pdfCandidateExpenses.map((expense) => expense.id))
    setPdfDialogOpen(true)
  }

  const togglePdfExpense = (expenseId: string) => {
    setSelectedPdfExpenseIds((current) =>
      current.includes(expenseId)
        ? current.filter((id) => id !== expenseId)
        : [...current, expenseId]
    )
  }

  const handleExportPdf = async () => {
    if (!event || selectedPdfExpenseIds.length === 0) return
    setExportingPdf(true)
    try {
      const response = await fetch(`/api/popup-events/${event.id}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedExpenseIds: selectedPdfExpenseIds,
          category: categoryFilter,
        }),
      })
      const data = await response.blob()
      if (!response.ok) throw new Error('PDF 생성 실패')

      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `${event.name}_${categoryFilter === 'all' ? '전체' : POPUP_EXPENSE_CATEGORY_LABELS[categoryFilter]}_${new Date().toISOString().split('T')[0]}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      setPdfDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'PDF 생성 중 오류가 발생했습니다.')
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">팝업행사</h1>
            <p className="mt-0.5 text-sm text-zinc-500">행사 영수증, 비용, 첨부 누락 관리</p>
          </div>
          <div className="flex gap-2">
            {event && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openPdfDialog}
                  className="gap-2 border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                >
                  <FileText className="h-3.5 w-3.5 text-zinc-500" />
                  PDF 저장
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/popup-events/${event.id}/export`, '_blank')}
                  className="gap-2 border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                >
                  <FileDown className="h-3.5 w-3.5 text-zinc-500" />
                  CSV 저장
                </Button>
              </>
            )}
            <Button size="sm" onClick={() => openCreateDialog()} className="gap-2 bg-zinc-900 hover:bg-zinc-700">
              <Plus className="h-3.5 w-3.5" />
              수동 등록 (⌘ K)
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-6">
          {[
            ['총 지출', formatCurrency(summary.totalGross, event?.currency || 'EUR')],
            ['VAT 합계', formatCurrency(summary.totalVat, event?.currency || 'EUR')],
            ['순비용', formatCurrency(summary.netCost, event?.currency || 'EUR')],
            ['영수증', `${summary.count}건`],
            ['첨부 누락', `${summary.missingAttachments}건`],
            ['미확인', `${summary.unchecked}건`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{label}</p>
              <p className="mt-2 text-lg font-semibold tabular-nums text-zinc-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleTopDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            className={`cursor-pointer rounded-xl border-2 border-dashed bg-white p-6 text-center transition-colors ${
              dragOver ? 'border-zinc-500 bg-zinc-100' : 'border-zinc-200 hover:border-zinc-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                if (files.length > 0) openCreateDialog(files)
                e.target.value = ''
              }}
            />
            <Upload className="mx-auto h-6 w-6 text-zinc-300" />
            <p className="mt-2 text-sm font-medium text-zinc-700">PDF/이미지 영수증 업로드</p>
            <p className="mt-1 text-xs text-zinc-400">드래그하거나 클릭하면 입력창이 열립니다</p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">카테고리별 비용</p>
            <div className="mt-3 space-y-2">
              {Object.entries(summary.byCategory).length === 0 ? (
                <p className="py-6 text-center text-xs text-zinc-400">아직 등록된 비용이 없습니다</p>
              ) : (
                Object.entries(summary.byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">{POPUP_EXPENSE_CATEGORY_LABELS[category] || category}</span>
                      <span className="font-semibold tabular-nums text-zinc-900">
                        {formatCurrency(amount, event?.currency || 'EUR')}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="거래처, 항목, 메모 검색..."
                className="h-8 border-zinc-200 pl-8 text-xs"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-[160px] border-zinc-300 bg-white text-xs font-medium text-zinc-800">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {Object.values(POPUP_EXPENSE_CATEGORIES).map((category) => (
                  <SelectItem key={category} value={category}>
                    {POPUP_EXPENSE_CATEGORY_LABELS[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => setMissingOnly((value) => !value)}
              className={`flex h-8 items-center gap-1 rounded-lg border px-3 text-xs font-medium transition-colors ${
                missingOnly
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : 'border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900'
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              첨부 누락만
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-900">영수증 내역</p>
              <span className="text-xs text-zinc-400">{filteredExpenses.length}건</span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2 p-5">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-12 animate-pulse rounded-lg bg-zinc-100" />
              ))}
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt className="mx-auto h-8 w-8 text-zinc-200" />
              <p className="mt-2 text-sm text-zinc-400">등록된 영수증 내역이 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                    <th className="px-5 py-3">날짜</th>
                    <th className="px-5 py-3">거래처/항목</th>
                    <th className="px-5 py-3">카테고리</th>
                    <th className="px-5 py-3 text-right">금액</th>
                    <th className="px-5 py-3 text-right">VAT</th>
                    <th className="px-5 py-3">첨부</th>
                    <th className="px-5 py-3">상태</th>
                    <th className="px-5 py-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="text-xs hover:bg-zinc-50/60">
                      <td className="whitespace-nowrap px-5 py-3 text-zinc-500">{formatDate(expense.date)}</td>
                      <td className="min-w-[220px] px-5 py-3">
                        <p className="font-medium text-zinc-800">{expense.vendor}</p>
                        <p className="mt-0.5 text-zinc-400">{expense.itemName}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-zinc-500">
                        {expense.category ? POPUP_EXPENSE_CATEGORY_LABELS[expense.category] : '미분류'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums text-zinc-900">
                        {formatCurrency(expense.grossAmount, expense.currency)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-zinc-500">
                        {expense.vatAmount !== null ? formatCurrency(expense.vatAmount, expense.currency) : '-'}
                      </td>
                      <td className="px-5 py-3">
                        {expense.attachments.length > 0 ? (
                          <div className="flex items-center gap-1 text-emerald-600">
                            <Paperclip className="h-3.5 w-3.5" />
                            <span>{expense.attachments.length}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                            <AlertCircle className="h-3 w-3" />
                            누락
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {expense.status === 'checked' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            확인완료
                          </span>
                        ) : (
                          <span className="text-zinc-400">미확인</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditDialog(expense)}
                            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
                            title="편집"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(expense)}
                            className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                            title="삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
          <DialogHeader className="border-b border-zinc-100 px-6 py-5">
            <DialogTitle className="text-sm font-semibold text-zinc-900">
              {editingExpense ? '영수증 내역 편집' : '영수증 내역 등록'}
            </DialogTitle>
            <p className="text-xs text-zinc-400">파일은 지금 추가하거나 나중에 다시 열어 추가할 수 있습니다</p>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">날짜</label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">거래처</label>
                <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="상호/거래처" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">항목</label>
                <Input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} placeholder="구매 항목" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">카테고리</label>
                <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(POPUP_EXPENSE_CATEGORIES).map((category) => (
                      <SelectItem key={category} value={category}>{POPUP_EXPENSE_CATEGORY_LABELS[category]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">총액</label>
                <Input type="number" step="0.01" value={form.grossAmount} onChange={(e) => setForm({ ...form, grossAmount: e.target.value })} placeholder="0.00" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">VAT율</label>
                <Select value={form.vatRate} onValueChange={(value) => setForm({ ...form, vatRate: value })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음</SelectItem>
                    {VAT_RATES.map((rate) => <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">결제수단</label>
                <Select value={form.paymentMethod} onValueChange={(value) => setForm({ ...form, paymentMethod: value })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(POPUP_PAYMENT_METHOD_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">확인상태</label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unchecked">미확인</SelectItem>
                    <SelectItem value="checked">확인완료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">메모</label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="resize-none text-xs" />
            </div>

            <div
              onDrop={(e) => {
                e.preventDefault()
                addPendingFiles(e.dataTransfer.files)
              }}
              onDragOver={(e) => e.preventDefault()}
              className="rounded-lg border-2 border-dashed border-zinc-200 p-4 text-center"
            >
              <input
                id="popup-expense-files"
                type="file"
                multiple
                accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addPendingFiles(e.target.files)
                  e.target.value = ''
                }}
              />
              <label htmlFor="popup-expense-files" className="cursor-pointer">
                <Paperclip className="mx-auto h-5 w-5 text-zinc-300" />
                <p className="mt-2 text-xs font-medium text-zinc-600">{fileLabel(pendingFiles)}</p>
                <p className="mt-1 text-[11px] text-zinc-400">PDF, JPG, PNG, WEBP · 최대 10MB</p>
              </label>
            </div>

            {editingExpense && editingExpense.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">기존 첨부파일</p>
                {editingExpense.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                    <FileIcon mimeType={attachment.mimeType} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-zinc-700">{attachment.fileName || '첨부파일'}</p>
                    </div>
                    {hasViewableMime(attachment.mimeType) && (
                      <button
                        type="button"
                        onClick={() => window.open(`/api/popup-expenses/${editingExpense.id}/attachments/${attachment.id}`, '_blank')}
                        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => window.open(`/api/popup-expenses/${editingExpense.id}/attachments/${attachment.id}?download=1`, '_blank')}
                      className="rounded p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(editingExpense.id, attachment.id)}
                      className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>취소</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-zinc-900 hover:bg-zinc-700">
              {saving ? '저장 중...' : '저장 (⌘ Enter)'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto p-0">
          <DialogHeader className="border-b border-zinc-100 px-6 py-5">
            <DialogTitle className="text-sm font-semibold text-zinc-900">PDF 저장 항목 선택</DialogTitle>
            <p className="text-xs text-zinc-500">
              {categoryFilter === 'all' ? '전체 카테고리' : POPUP_EXPENSE_CATEGORY_LABELS[categoryFilter]} 중
              {' '}{selectedPdfExpenseIds.length}건을 내보냅니다.
            </p>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-600">선택된 항목</span>
                <span className="font-semibold tabular-nums text-zinc-900">
                  {selectedPdfExpenseIds.length}건 · {formatCurrency(selectedPdfTotal, event?.currency || 'EUR')}
                </span>
              </div>
            </div>

            {pdfCandidateExpenses.length === 0 ? (
              <div className="py-10 text-center text-sm text-zinc-400">내보낼 항목이 없습니다</div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedPdfExpenseIds(pdfCandidateExpenses.map((expense) => expense.id))}
                    className="text-xs font-medium text-zinc-700 hover:text-zinc-950"
                  >
                    전체 선택
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPdfExpenseIds([])}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-950"
                  >
                    전체 해제
                  </button>
                </div>
                {pdfCandidateExpenses.map((expense) => {
                  const checked = selectedPdfExpenseIds.includes(expense.id)
                  return (
                    <label
                      key={expense.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 hover:border-zinc-300"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePdfExpense(expense.id)}
                        className="mt-1 h-4 w-4 rounded border-zinc-300"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-zinc-900">{expense.vendor}</p>
                          <span className="text-xs font-semibold tabular-nums text-zinc-900">
                            {formatCurrency(expense.grossAmount, expense.currency)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {formatDate(expense.date)} · {expense.itemName}
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          첨부 {expense.attachments.length}개 · {expense.category ? POPUP_EXPENSE_CATEGORY_LABELS[expense.category] : '미분류'}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
            <Button variant="outline" size="sm" onClick={() => setPdfDialogOpen(false)}>취소</Button>
            <Button
              size="sm"
              onClick={handleExportPdf}
              disabled={exportingPdf || selectedPdfExpenseIds.length === 0}
              className="bg-zinc-900 hover:bg-zinc-700"
            >
              {exportingPdf ? 'PDF 생성 중...' : `${selectedPdfExpenseIds.length}건 PDF 저장`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

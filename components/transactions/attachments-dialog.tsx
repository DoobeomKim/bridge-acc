'use client'

import { useState, useEffect } from 'react'
import { X, FileText, ImageIcon, Download, Eye, Paperclip } from 'lucide-react'

interface Attachment {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
}

interface AttachmentsDialogProps {
  transactionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function AttachmentsDialog({
  transactionId,
  open,
  onOpenChange,
}: AttachmentsDialogProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) loadAttachments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transactionId])

  const loadAttachments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/transactions/${transactionId}/attachments`)
      const data = await response.json()
      if (data.success) setAttachments(data.data)
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-zinc-200 max-w-md w-full shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">첨부파일 (Anhänge)</h2>
            <p className="text-xs text-zinc-400 mt-0.5">거래 관련 증빙자료 및 첨부파일</p>
          </div>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-zinc-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : attachments.length > 0 ? (
            <div className="space-y-1.5">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-zinc-50 rounded-lg border border-zinc-100"
                >
                  <FileIcon mimeType={attachment.mimeType} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-700 truncate">{attachment.fileName}</p>
                    <p className="text-[11px] text-zinc-400">{formatFileSize(attachment.fileSize)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {isViewable(attachment.mimeType) && (
                      <button
                        onClick={() => window.open(`/api/transactions/${transactionId}/attachments/${attachment.id}/view`, '_blank')}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
                        title="보기"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = `/api/transactions/${transactionId}/attachments/${attachment.id}`
                        link.download = attachment.fileName
                        link.click()
                      }}
                      className="p-1.5 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
                      title="다운로드"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-10">
              <Paperclip className="w-4 h-4 text-zinc-300" />
              <p className="text-xs text-zinc-400">첨부된 파일이 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

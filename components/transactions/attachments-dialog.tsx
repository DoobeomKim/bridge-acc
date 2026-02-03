'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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

export function AttachmentsDialog({
  transactionId,
  open,
  onOpenChange,
}: AttachmentsDialogProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadAttachments()
    }
  }, [open, transactionId])

  const loadAttachments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/transactions/${transactionId}/attachments`)
      const data = await response.json()
      if (data.success) {
        setAttachments(data.data)
      }
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAttachment = (attachmentId: string, fileName: string) => {
    const url = `/api/transactions/${transactionId}/attachments/${attachmentId}`
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleViewAttachment = (attachmentId: string, mimeType: string) => {
    const viewableTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif']

    if (viewableTypes.some(type => mimeType.toLowerCase().includes(type))) {
      const url = `/api/transactions/${transactionId}/attachments/${attachmentId}/view`
      window.open(url, '_blank')
    } else {
      alert('이 파일 형식은 브라우저에서 미리보기를 지원하지 않습니다. 다운로드하여 확인해주세요.')
    }
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

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType === 'application/pdf') return '📄'
    return '📎'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>첨부파일 (Anhänge)</DialogTitle>
          <DialogDescription>
            거래 관련 증빙자료 및 첨부파일
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">로딩 중...</p>
            </div>
          ) : attachments.length > 0 ? (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-2xl">
                      {getFileIcon(attachment.mimeType)}
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
                      className="text-green-600 hover:text-green-700"
                    >
                      다운로드
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                첨부된 파일이 없습니다
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UploadResult {
  imported: number
  duplicates: number
  errors: string[]
}

interface CsvUploadProps {
  onUploadSuccess?: () => void
}

export function CsvUpload({ onUploadSuccess }: CsvUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string[] | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset states
    setError(null)
    setErrorDetails(null)
    setResult(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/transactions/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Upload failed')
        setErrorDetails(data.details || null)
        throw new Error(data.error || 'Upload failed')
      }

      setResult({
        imported: data.data.imported,
        duplicates: data.data.duplicates,
        errors: data.data.errors || [],
      })

      if (onUploadSuccess) {
        onUploadSuccess()
      }
    } catch (err) {
      if (!error) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file && file.name.endsWith('.csv')) {
      // Manually trigger file input change
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleFileSelect({ target: fileInputRef.current } as any)
      }
    } else {
      setError('Please drop a CSV file')
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV 업로드 (CSV Upload)</CardTitle>
        <CardDescription>
          Vivid 은행에서 다운로드한 거래내역 CSV 파일을 업로드하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onClick={handleButtonClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">업로드 중...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl mb-2">📤</div>
              <p className="text-sm font-medium">
                클릭하거나 파일을 드래그하여 업로드
              </p>
              <p className="text-xs text-muted-foreground">
                CSV 파일만 지원 (최대 10MB)
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 font-medium">오류 발생</p>
            <p className="text-sm text-red-600">{error}</p>
            {errorDetails && errorDetails.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-red-700 mb-1">상세 오류:</p>
                <ul className="text-xs text-red-600 space-y-1">
                  {errorDetails.slice(0, 10).map((detail, idx) => (
                    <li key={idx}>• {detail}</li>
                  ))}
                  {errorDetails.length > 10 && (
                    <li className="font-medium">... 그 외 {errorDetails.length - 10}개</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800 font-medium mb-2">
              업로드 완료!
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">
                {result.imported}개 거래 추가됨
              </Badge>
              {result.duplicates > 0 && (
                <Badge variant="secondary">
                  {result.duplicates}개 중복 제외됨
                </Badge>
              )}
              {result.errors.length > 0 && (
                <Badge variant="destructive">
                  {result.errors.length}개 오류
                </Badge>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">오류 내역:</p>
                <ul className="text-xs text-red-600 space-y-1">
                  {result.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>... 그 외 {result.errors.length - 5}개</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

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
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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

      onUploadSuccess?.()
    } catch (err) {
      if (!error) setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    if (file && file.name.endsWith('.csv')) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleFileSelect({ target: fileInputRef.current } as any)
      }
    } else {
      setError('CSV 파일만 업로드 가능합니다')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">CSV 업로드</p>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-lg px-6 py-5 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-zinc-400 bg-zinc-50'
            : 'border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50/50'
        }`}
      >
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />

        {uploading ? (
          <div className="space-y-2">
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-xs text-zinc-400">업로드 중...</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Upload className="w-5 h-5 text-zinc-300 mx-auto" />
            <p className="text-xs font-medium text-zinc-600">클릭 또는 드래그하여 업로드</p>
            <p className="text-[11px] text-zinc-400">Vivid CSV · 최대 10MB</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-red-700">{error}</p>
              {errorDetails && errorDetails.length > 0 && (
                <ul className="mt-1.5 space-y-0.5">
                  {errorDetails.slice(0, 5).map((detail, idx) => (
                    <li key={idx} className="text-[11px] text-red-500">· {detail}</li>
                  ))}
                  {errorDetails.length > 5 && (
                    <li className="text-[11px] text-red-400">... 외 {errorDetails.length - 5}개</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-emerald-700">업로드 완료</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] font-medium text-emerald-600">{result.imported}건 추가</span>
                {result.duplicates > 0 && (
                  <span className="text-[11px] text-zinc-400">{result.duplicates}건 중복 제외</span>
                )}
                {result.errors.length > 0 && (
                  <span className="text-[11px] text-red-500">{result.errors.length}건 오류</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

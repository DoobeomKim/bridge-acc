'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CompanySettings } from '@/components/settings/company-settings'
import { BankConnections } from '@/components/settings/bank-connections'
import { Shield, Check, CheckCircle, AlertCircle } from 'lucide-react'

type SessionDuration = '24h' | '7d' | '30d-sliding'

interface Settings {
  companyName: string | null
  email: string | null
  taxNumber: string | null
  vatId: string | null
  address: string | null
  defaultVatRate: number
  fiscalYearStart: number
  hrb: string | null
  managingDirector: string | null
  bankName: string | null
  iban: string | null
  bic: string | null
  sessionDuration: SessionDuration
}

const SESSION_OPTIONS: { value: SessionDuration; label: string; desc: string }[] = [
  { value: '24h', label: '24시간', desc: '매일 재로그인 필요. 보안 최우선.' },
  { value: '7d', label: '7일', desc: '일주일마다 재로그인. 권장 설정.' },
  { value: '30d-sliding', label: '30일 (자동 연장)', desc: '사용할 때마다 30일 연장.' },
]

interface BankConnection {
  id: string
  bankName: string
  connectionType: string
  status: string
  lastSyncAt: string | null
  lastSyncStatus: string | null
  autoSync: boolean
  bankAccount: {
    accountName: string
    iban: string | null
  }
}

function SecuritySettings({ sessionDuration, onSaved }: {
  sessionDuration: SessionDuration
  onSaved: () => void
}) {
  const [selected, setSelected] = useState<SessionDuration>(sessionDuration)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (selected === sessionDuration) return
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionDuration: selected }),
      })
      setSaved(true)
      onSaved()
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-zinc-400" />
        <h2 className="text-sm font-semibold text-zinc-900">보안 설정</h2>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">로그인 세션 유지 시간</p>
          <p className="text-xs text-zinc-400 mb-3">다음 로그인부터 적용됩니다.</p>
          <div className="space-y-2">
            {SESSION_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selected === opt.value
                    ? 'border-zinc-900 bg-zinc-50'
                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
                }`}
              >
                <input
                  type="radio"
                  name="sessionDuration"
                  value={opt.value}
                  checked={selected === opt.value}
                  onChange={() => setSelected(opt.value)}
                  className="mt-0.5 accent-zinc-900"
                />
                <div>
                  <p className="text-xs font-medium text-zinc-800">{opt.label}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || selected === sessionDuration}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {saved ? <><Check className="w-4 h-4" /> 저장됨</> : saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}

function SettingsContent() {
  const searchParams = useSearchParams()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [connections, setConnections] = useState<BankConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
    fetchConnections()

    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const msg = searchParams.get('message')

    if (success === 'true' && msg) {
      setMessage({ type: 'success', text: msg })
      setTimeout(() => fetchConnections(), 500)
    } else if (error && msg) {
      setMessage({ type: 'error', text: msg })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      if (data.success) setSettings(data.data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/bank-connections')
      const data = await response.json()
      if (data.success) setConnections(data.data)
    } catch (error) {
      console.error('Error fetching connections:', error)
    }
  }

  const handleSync = async (connectionId: string) => {
    setMessage({ type: 'success', text: '동기화 중...' })
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Sync failed')
      setMessage({ type: 'success', text: `동기화 완료! ${data.data.imported}개 거래 추가됨 (${data.data.duplicates}개 중복 제외)` })
      setTimeout(() => fetchConnections(), 500)
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '동기화 실패' })
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('정말 연결을 끊으시겠습니까?')) return
    try {
      const response = await fetch('/api/bank-connections/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Disconnect failed')
      setMessage({ type: 'success', text: '은행 연결이 해제되었습니다' })
      setTimeout(() => fetchConnections(), 500)
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '연결 해제 실패' })
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    setMessage(null)
    try {
      const response = await fetch('/api/bank-connections/connect', { method: 'POST' })
      const data = await response.json()
      if (!data.success) throw new Error(data.message || data.error || 'Connection failed')
      const webFormUrl = data.data.webFormUrl
      const width = 800, height = 700
      const left = (screen.width - width) / 2
      const top = (screen.height - height) / 2
      window.open(webFormUrl, 'finAPIWebForm', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`)
      setMessage({ type: 'success', text: '은행 연결 창이 열렸습니다. 완료 후 자동으로 연결됩니다.' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '은행 연결을 시작할 수 없습니다' })
    } finally {
      setConnecting(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
          <div className="space-y-1">
            <div className="h-6 w-16 bg-zinc-100 rounded animate-pulse" />
            <div className="h-4 w-32 bg-zinc-100 rounded animate-pulse" />
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="h-2.5 w-20 bg-zinc-100 rounded animate-pulse mb-4" />
                <div className="h-7 w-32 bg-zinc-100 rounded animate-pulse mb-2" />
                <div className="h-2.5 w-14 bg-zinc-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">설정</h1>
          <p className="text-sm text-zinc-500 mt-0.5">회사 정보 및 은행 연결 관리</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-100'
              : 'bg-red-50 border-red-100'
          }`}>
            {message.type === 'success'
              ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              : <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            }
            <p className={`text-xs font-medium ${message.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
              {message.text}
            </p>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <CompanySettings settings={settings} onSaved={fetchSettings} />
          <div className="space-y-5">
            <SecuritySettings
              sessionDuration={settings.sessionDuration || '7d'}
              onSaved={fetchSettings}
            />
            <BankConnections
              connections={connections}
              onSync={handleSync}
              onDisconnect={handleDisconnect}
              onConnect={connecting ? undefined : handleConnect}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="h-6 w-16 bg-zinc-100 rounded animate-pulse" />
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  )
}

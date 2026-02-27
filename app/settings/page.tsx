'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CompanySettings } from '@/components/settings/company-settings'
import { BankConnections } from '@/components/settings/bank-connections'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Check } from 'lucide-react'

type SessionDuration = '24h' | '7d' | '30d-sliding'

interface Settings {
  companyName: string | null
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
  { value: '30d-sliding', label: '30일 (자동 연장)', desc: '사용할 때마다 30일 연장. 거의 안 끊김.' },
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="w-4 h-4" />
          보안 설정
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-3">로그인 세션 유지 시간</p>
          <p className="text-xs text-muted-foreground mb-3">
            다음 로그인부터 적용됩니다.
          </p>
          <div className="space-y-2">
            {SESSION_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selected === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="sessionDuration"
                  value={opt.value}
                  checked={selected === opt.value}
                  onChange={() => setSelected(opt.value)}
                  className="mt-0.5 accent-blue-600"
                />
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || selected === sessionDuration}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              저장됨
            </>
          ) : saving ? '저장 중...' : '저장'}
        </button>
      </CardContent>
    </Card>
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

    // Check for callback messages
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const msg = searchParams.get('message')

    if (success === 'true' && msg) {
      setMessage({ type: 'success', text: msg })
      // Refresh connections
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
      if (data.success) {
        setSettings(data.data)
      }
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
      if (data.success) {
        setConnections(data.data)
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    }
  }

  const handleSync = async (connectionId: string) => {
    setMessage({ type: 'success', text: '동기화 중...' })

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionId }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Sync failed')
      }

      setMessage({
        type: 'success',
        text: `동기화 완료! ${data.data.imported}개 거래 추가됨 (${data.data.duplicates}개 중복 제외)`,
      })

      // Refresh connections
      setTimeout(() => fetchConnections(), 500)
    } catch (error) {
      console.error('Error syncing:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '동기화 실패',
      })
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('정말 연결을 끊으시겠습니까?')) return

    setMessage({ type: 'success', text: '연결 해제 중...' })

    try {
      const response = await fetch('/api/bank-connections/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionId }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Disconnect failed')
      }

      setMessage({
        type: 'success',
        text: '은행 연결이 해제되었습니다',
      })

      // Refresh connections
      setTimeout(() => fetchConnections(), 500)
    } catch (error) {
      console.error('Error disconnecting:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '연결 해제 실패',
      })
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/bank-connections/connect', {
        method: 'POST',
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || data.error || 'Connection failed')
      }

      // Open finAPI Web Form in new window
      const webFormUrl = data.data.webFormUrl
      const width = 800
      const height = 700
      const left = (screen.width - width) / 2
      const top = (screen.height - height) / 2

      window.open(
        webFormUrl,
        'finAPIWebForm',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      )

      setMessage({
        type: 'success',
        text: '은행 연결 창이 열렸습니다. 창을 완료하면 자동으로 연결됩니다.',
      })
    } catch (error) {
      console.error('Error starting connection:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '은행 연결을 시작할 수 없습니다',
      })
    } finally {
      setConnecting(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">설정 (Einstellungen)</h1>
        <p className="text-muted-foreground">
          회사 정보와 은행 연결을 관리하세요
        </p>
      </div>

      {message && (
        <Card>
          <CardContent
            className={`pt-6 ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {message.text}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        <CompanySettings settings={settings} onSaved={fetchSettings} />
        <div className="space-y-8">
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
  )
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">로딩 중...</p>
            </div>
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  )
}

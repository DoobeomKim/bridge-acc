'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils-accounting'

interface BankConnection {
  id: string
  bankName: string
  status: string
  lastSyncAt: string | null
  lastSyncStatus: string | null
  bankAccount: {
    accountName: string
  }
}

interface SyncButtonProps {
  onSyncComplete?: () => void
}

export function SyncButton({ onSyncComplete }: SyncButtonProps) {
  const [connections, setConnections] = useState<BankConnection[]>([])
  const [syncing, setSyncing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/bank-connections')
      const data = await response.json()
      if (data.success) {
        const apiConnections = data.data.filter(
          (c: BankConnection) => c.status === 'active'
        )
        setConnections(apiConnections)
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    }
  }

  const handleSync = async (connectionId: string) => {
    setSyncing(connectionId)
    setMessage(null)

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
        text: `✅ ${data.data.imported}개 거래 추가됨 (${data.data.duplicates}개 중복 제외)`,
      })

      // Refresh connections and notify parent
      fetchConnections()
      if (onSyncComplete) {
        onSyncComplete()
      }
    } catch (error) {
      console.error('Error syncing:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '동기화 실패',
      })
    } finally {
      setSyncing(null)
    }
  }

  if (connections.length === 0) {
    return null
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">자동 동기화</h3>
              <p className="text-xs text-muted-foreground">
                연결된 은행에서 거래내역 가져오기
              </p>
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {connection.bankName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {connection.bankAccount.accountName}
                    </Badge>
                  </div>
                  {connection.lastSyncAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      마지막 동기화: {formatDate(connection.lastSyncAt)}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSync(connection.id)}
                  disabled={syncing === connection.id}
                >
                  {syncing === connection.id ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      동기화 중...
                    </>
                  ) : (
                    <>🔄 지금 동기화</>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

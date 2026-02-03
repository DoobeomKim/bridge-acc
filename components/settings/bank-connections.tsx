'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils-accounting'

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

interface BankConnectionsProps {
  connections: BankConnection[]
  onSync?: (connectionId: string) => void
  onDisconnect?: (connectionId: string) => void
  onConnect?: () => void
}

export function BankConnections({
  connections,
  onSync,
  onDisconnect,
  onConnect,
}: BankConnectionsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600">활성</Badge>
      case 'error':
        return <Badge variant="destructive">오류</Badge>
      case 'disconnected':
        return <Badge variant="secondary">연결 끊김</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getSyncStatusIcon = (status: string | null) => {
    if (!status) return '⏸️'
    switch (status) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      default:
        return '⏸️'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>은행 연결 (Bankverbindungen)</CardTitle>
            <CardDescription>
              연결된 은행 계좌 목록
            </CardDescription>
          </div>
          <Button onClick={onConnect}>
            ➕ 은행 연결
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {connections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              연결된 은행이 없습니다
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              은행을 연결하면 자동으로 거래내역을 가져올 수 있습니다
            </p>
            <Button onClick={onConnect}>
              은행 연결하기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{connection.bankName}</h3>
                      {getStatusBadge(connection.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {connection.bankAccount.accountName}
                    </p>
                    {connection.bankAccount.iban && (
                      <p className="text-xs text-muted-foreground">
                        {connection.bankAccount.iban}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {connection.connectionType === 'api' ? 'API' : 'CSV'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{getSyncStatusIcon(connection.lastSyncStatus)}</span>
                    <span>
                      {connection.lastSyncAt
                        ? `마지막 동기화: ${formatDate(connection.lastSyncAt)}`
                        : '동기화 안 됨'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {connection.autoSync && (
                      <Badge variant="secondary" className="text-xs">
                        자동 동기화
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {connection.connectionType === 'api' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSync?.(connection.id)}
                      disabled={connection.status !== 'active'}
                    >
                      🔄 지금 동기화
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDisconnect?.(connection.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    연결 끊기
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

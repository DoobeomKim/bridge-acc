'use client'

import { Landmark, RefreshCw, Unlink, Plus, CheckCircle, AlertCircle, Clock } from 'lucide-react'
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

const STATUS_STYLES: Record<string, string> = {
  active:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  error:        'bg-red-50 text-red-600 border-red-200',
  disconnected: 'bg-zinc-100 text-zinc-500 border-zinc-200',
}
const STATUS_LABELS: Record<string, string> = {
  active: '활성', error: '오류', disconnected: '연결 끊김',
}

function SyncIcon({ status }: { status: string | null }) {
  if (status === 'success') return <CheckCircle className="w-3 h-3 text-emerald-500" />
  if (status === 'error') return <AlertCircle className="w-3 h-3 text-red-500" />
  return <Clock className="w-3 h-3 text-zinc-400" />
}

export function BankConnections({ connections, onSync, onDisconnect, onConnect }: BankConnectionsProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">은행 연결</h2>
          <p className="text-xs text-zinc-400 mt-0.5">자동 거래내역 동기화</p>
        </div>
        {onConnect && (
          <button
            onClick={onConnect}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-3 h-3" /> 은행 연결
          </button>
        )}
      </div>

      <div className="p-5">
        {connections.length === 0 ? (
          <div className="text-center py-8">
            <Landmark className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">연결된 은행이 없습니다</p>
            <p className="text-xs text-zinc-300 mt-1">은행을 연결하면 자동으로 거래내역을 가져옵니다</p>
            {onConnect && (
              <button
                onClick={onConnect}
                className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium bg-zinc-900 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <Plus className="w-3 h-3" /> 은행 연결하기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((connection) => (
              <div key={connection.id} className="border border-zinc-100 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-semibold text-zinc-800">{connection.bankName}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${STATUS_STYLES[connection.status] || STATUS_STYLES.disconnected}`}>
                        {STATUS_LABELS[connection.status] || connection.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">{connection.bankAccount.accountName}</p>
                    {connection.bankAccount.iban && (
                      <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">{connection.bankAccount.iban}</p>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200 ml-2">
                    {connection.connectionType === 'api' ? 'API' : 'CSV'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <SyncIcon status={connection.lastSyncStatus} />
                    {connection.lastSyncAt
                      ? `동기화: ${formatDate(connection.lastSyncAt)}`
                      : '동기화 안 됨'}
                    {connection.autoSync && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-500">
                        자동
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {connection.connectionType === 'api' && (
                      <button
                        onClick={() => onSync?.(connection.id)}
                        disabled={connection.status !== 'active'}
                        className="flex items-center gap-1 px-2.5 py-1 border border-zinc-200 text-zinc-600 text-[11px] font-medium rounded-md hover:border-zinc-900 hover:text-zinc-900 transition-all disabled:opacity-40"
                      >
                        <RefreshCw className="w-3 h-3" /> 동기화
                      </button>
                    )}
                    <button
                      onClick={() => onDisconnect?.(connection.id)}
                      className="flex items-center gap-1 px-2.5 py-1 border border-zinc-200 text-zinc-500 text-[11px] font-medium rounded-md hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
                    >
                      <Unlink className="w-3 h-3" /> 연결 끊기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

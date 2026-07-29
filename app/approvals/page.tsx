'use client'

import { useEffect, useState } from 'react'
import { Check, Clock3, Play, RefreshCw, ShieldCheck, X } from 'lucide-react'

type Approval = {
  id: string
  title: string
  summary: string
  actionType: string
  workspace: string
  riskLevel: string
  status: string
  evidence: string | null
  requestedBy: string
  createdAt: string
}

type Briefing = {
  id: string
  periodKey: string
  headline: string
  priorities: string
  financeSignals: string
  growthSignals: string
  risks: string
  decisionsNeeded: string
  createdAt: string
}

function parseList(value?: string | null): string[] {
  if (!value) return []
  try { return JSON.parse(value) } catch { return [] }
}

function parseRecord(value?: string | null): Record<string, string | number> {
  if (!value) return {}
  try { return JSON.parse(value) } catch { return {} }
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    const [approvalResponse, briefingResponse] = await Promise.all([
      fetch('/api/approvals?status=pending'),
      fetch('/api/briefings/latest'),
    ])
    const approvalJson = await approvalResponse.json()
    const briefingJson = await briefingResponse.json()
    setApprovals(approvalJson.data || [])
    setBriefing(briefingJson.data || null)
  }

  useEffect(() => { void load() }, [])

  async function decide(id: string, status: string) {
    setBusy(true)
    await fetch(`/api/approvals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
    setBusy(false)
  }

  async function runBriefing() {
    setBusy(true)
    await fetch('/api/automations/weekly-business-briefing', { method: 'POST' })
    await load()
    setBusy(false)
  }

  const priorities = parseList(briefing?.priorities)
  const risks = parseList(briefing?.risks)
  const decisions = parseList(briefing?.decisionsNeeded)
  const finance = parseRecord(briefing?.financeSignals)

  return (
    <div className="mx-auto min-h-screen max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            <ShieldCheck className="h-4 w-4" /> Human control plane
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">승인함 & 주간 브리핑</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            AI는 근거와 선택지를 준비합니다. 외부 행동과 중요한 결정은 이곳에서 사람이 승인합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={runBriefing} disabled={busy} className="flex h-11 items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/15 disabled:opacity-50">
            <Play className="h-4 w-4" /> 브리핑 지금 실행
          </button>
          <button onClick={load} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-700 text-slate-300" aria-label="새로고침"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/65">
          <div className="flex items-center justify-between border-b border-cyan-300/10 px-5 py-4">
            <div><h2 className="font-semibold text-white">승인 대기</h2><p className="mt-1 text-xs text-slate-500">헌법 v1.0.0 기준</p></div>
            <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">{approvals.length} pending</span>
          </div>
          <div className="space-y-3 p-4">
            {approvals.length === 0 && (
              <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-slate-700 text-center">
                <div><Check className="mx-auto mb-3 h-6 w-6 text-emerald-300" /><p className="text-sm text-slate-300">현재 승인 대기 작업이 없습니다.</p></div>
              </div>
            )}
            {approvals.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
                  <span className="rounded-full bg-violet-400/10 px-2.5 py-1 text-violet-200">{item.workspace}</span>
                  <span className="rounded-full bg-rose-400/10 px-2.5 py-1 text-rose-200">{item.riskLevel}</span>
                  <span className="text-slate-500">{item.actionType}</span>
                </div>
                <h3 className="mt-3 font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button disabled={busy} onClick={() => decide(item.id, 'approved')} className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200"><Check className="h-3.5 w-3.5" /> 승인</button>
                  <button disabled={busy} onClick={() => decide(item.id, 'changes_requested')} className="flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200"><RefreshCw className="h-3.5 w-3.5" /> 수정 요청</button>
                  <button disabled={busy} onClick={() => decide(item.id, 'deferred')} className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200"><Clock3 className="h-3.5 w-3.5" /> 보류</button>
                  <button disabled={busy} onClick={() => decide(item.id, 'rejected')} className="flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-200"><X className="h-3.5 w-3.5" /> 반려</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/65">
          <div className="border-b border-cyan-300/10 px-5 py-4"><h2 className="font-semibold text-white">주간 사업개발 브리핑</h2><p className="mt-1 text-xs text-slate-500">매주 월요일 08:00 · Europe/Berlin</p></div>
          {!briefing ? (
            <div className="grid min-h-72 place-items-center p-6 text-center text-sm text-slate-400">아직 생성된 브리핑이 없습니다.<br />상단 버튼으로 첫 실행을 시작할 수 있습니다.</div>
          ) : (
            <div className="space-y-5 p-5">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Week of {briefing.periodKey}</p><p className="mt-2 text-lg font-semibold leading-7 text-white">{briefing.headline}</p></div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-emerald-400/10 p-3"><p className="text-slate-500">수입</p><p className="mt-1 font-semibold text-emerald-200">€{Number(finance.income || 0).toLocaleString()}</p></div>
                <div className="rounded-xl bg-rose-400/10 p-3"><p className="text-slate-500">지출</p><p className="mt-1 font-semibold text-rose-200">€{Number(finance.expense || 0).toLocaleString()}</p></div>
                <div className="rounded-xl bg-cyan-400/10 p-3"><p className="text-slate-500">오픈 청구</p><p className="mt-1 font-semibold text-cyan-200">{finance.openInvoices || 0}</p></div>
              </div>
              {[['이번 주 우선순위', priorities], ['위험 신호', risks], ['대표 결정 필요', decisions]].map(([title, items]) => (
                <div key={title as string}><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title as string}</h3><ul className="mt-2 space-y-2">{(items as string[]).map((item) => <li key={item} className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-300">{item}</li>)}</ul></div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

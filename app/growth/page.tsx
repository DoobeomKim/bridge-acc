'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Building2, Check, ExternalLink, FlaskConical, Plus, RefreshCw, Search, Send, ShieldCheck, Target, X } from 'lucide-react'

type Approval = { id: string; status: string }
type Draft = { id: string; channel: string; language: string; subject: string | null; body: string; status: string; approvalRequest: Approval | null }
type Customer = { id: string; customerNumber: string; name: string; company: string | null; email: string | null; phone: string | null; country: string }
type ResearchRun = { id: string; skillKey: string; skillVersion: string; status: string; triggerType: string; inputEvidence: string | null; output: string | null; error: string | null; nextAction: string | null; scheduledFor: string | null; startedAt: string | null; finishedAt: string | null; createdAt: string }
type ResearchSource = { id: string; url: string; title: string; excerpt: string | null; retrievedAt: string }
type StructuredResearchItem = { category: string; status: 'confirmed' | 'not_found' | 'needs_research'; summary: string; facts: string[]; inferences: string[]; missingInformation: string[]; sourceUrls: string[]; checkedAt: string; nextSearch: string | null }
type StructuredResearch = { policyVersion: string; overallStatus: string; officialSourceCount: number; recommendedApproach: string; items: StructuredResearchItem[] }
type Lead = {
  id: string; companyName: string; website: string | null; country: string | null; industry: string | null
  sourceUrl: string | null; evidence: string | null; researchSummary: string | null; uncertainties: string | null
  researchPurpose: string | null; researchQuestion: string | null; priority: string; sourceType: string; customer: Customer | null
  facts: string | null; inferences: string | null; researchDetails: string | null; researchOverallStatus: string; researchPolicyVersion: string | null
  opportunityScore: number | null; fitScore: number | null; actionabilityScore: number | null; confidence: number | null; sourceCount: number; researchSources: ResearchSource[]
  reviewStatus: string; stage: string; nextAction: string | null; outreachDrafts: Draft[]
}
type Campaign = {
  id: string; workspace: string; name: string; hypothesis: string; targetAudience: string; offer: string | null
  status: string; successCriteria: string; leads: Lead[]; researchRuns: ResearchRun[]
}

const stages = [
  ['qualified', '검토 완료'], ['contact_ready', '접촉 준비'], ['contacted', '접촉'], ['replied', '응답'],
  ['meeting', '미팅'], ['proposal', '제안'], ['negotiation', '협상'], ['won', '계약'],
] as const

const workspaceCopy = {
  bridge: {
    label: 'BridgeMakers Services',
    campaign: '독일 진출 한국 기업 현지 콘텐츠 패키지 검증',
    hypothesis: '독일 박람회에 참가하는 한국 기업은 단순 영상 제작보다 박람회 전후 콘텐츠와 후속 영업 패키지에 더 높은 가치를 느낀다.',
    target: '독일 박람회 참가 예정 한국 소비재 기업',
    offer: 'Trade Fair Content Sprint',
  },
  fairtale: {
    label: 'Fair Tale',
    campaign: '유럽 진출 초기 기업 제품 검토 파일럿',
    hypothesis: '유럽 진출 초기 한국 기업은 복잡한 플랫폼 가입보다 공개 가능한 제품 정보로 받는 바이어 상담 준비 리포트에 먼저 반응한다.',
    target: '유럽 진출을 준비하는 한국 식품·뷰티·생활용품 기업',
    offer: '무료 제품 검토 → 유료 시장진출 준비 프로그램',
  },
} as const

function safeCriteria(value: string) {
  try { return JSON.parse(value) as Record<string, number> } catch { return {} }
}

function parseStringList(value: string) {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.join('\n') : value
  } catch { return value }
}

export default function GrowthPage() {
  const [workspace, setWorkspace] = useState<'bridge' | 'fairtale'>('bridge')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignId, setCampaignId] = useState('')
  const [tab, setTab] = useState<'overview' | 'discovery' | 'research' | 'pipeline'>('discovery')
  const [loading, setLoading] = useState(true)
  const [showCampaignForm, setShowCampaignForm] = useState(false)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerLoading, setCustomerLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [researchStarting, setResearchStarting] = useState(false)
  const [researchProgress, setResearchProgress] = useState<{ current: number; total: number } | null>(null)
  const [researchingLeadId, setResearchingLeadId] = useState('')
  const [researchError, setResearchError] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [draftLead, setDraftLead] = useState<Lead | null>(null)
  const [discoveryStarting, setDiscoveryStarting] = useState(false)
  const [selectedProspects, setSelectedProspects] = useState<string[]>([])
  const [bulkResearchProgress, setBulkResearchProgress] = useState<{ current: number; total: number; company: string } | null>(null)

  const activeCampaign = campaigns.find((item) => item.id === campaignId) || campaigns[0] || null
  const leads = activeCampaign?.leads || []
  const pending = leads.filter((lead) => lead.reviewStatus === 'pending' || lead.reviewStatus === 'info_needed')
  const qualified = leads.filter((lead) => lead.reviewStatus === 'qualified')
  const discovered = leads.filter((lead) => lead.stage === 'discovered')
  const screeningPassed = discovered.filter((lead) => lead.reviewStatus === 'screening_passed')
  const reviewNeeded = discovered.filter((lead) => lead.reviewStatus === 'review_needed')
  const held = discovered.filter((lead) => lead.reviewStatus === 'held')
  const detailed = leads.filter((lead) => lead.stage === 'researched' || lead.researchDetails)

  async function load(nextWorkspace = workspace) {
    setLoading(true)
    const response = await fetch(`/api/growth?workspace=${nextWorkspace}`)
    const result = await response.json()
    const next = result.data || []
    setCampaigns(next)
    setCampaignId((current) => next.some((item: Campaign) => item.id === current) ? current : (next[0]?.id || ''))
    setLoading(false)
  }

  useEffect(() => { void load(workspace) }, [workspace])

  const metrics = useMemo(() => ({
    researched: leads.length,
    qualified: qualified.length,
    contacted: leads.filter((lead) => ['contacted', 'replied', 'meeting', 'proposal', 'negotiation', 'won'].includes(lead.stage)).length,
    meetings: leads.filter((lead) => ['meeting', 'proposal', 'negotiation', 'won'].includes(lead.stage)).length,
    contracts: leads.filter((lead) => lead.stage === 'won').length,
  }), [leads])

  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    await fetch('/api/growth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      type: 'campaign', workspace, name: data.get('name'), hypothesis: data.get('hypothesis'), targetAudience: data.get('targetAudience'), offer: data.get('offer'),
    }) })
    setShowCampaignForm(false)
    await load()
  }

  async function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeCampaign) return
    const data = new FormData(event.currentTarget)
    await fetch('/api/growth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      type: 'lead', campaignId: activeCampaign.id, companyName: data.get('companyName'), website: data.get('website'), country: data.get('country'),
      industry: data.get('industry'), sourceUrl: data.get('sourceUrl'), evidence: data.get('evidence'), researchSummary: data.get('researchSummary'),
      uncertainties: data.get('uncertainties'), researchPurpose: data.get('researchPurpose'), researchQuestion: data.get('researchQuestion'),
      priority: data.get('priority'), fitScore: Number(data.get('fitScore')),
    }) })
    setShowLeadForm(false)
    await load()
  }

  async function openCustomerPicker() {
    setFormError('')
    setShowCustomerPicker(true)
    if (customers.length > 0) return
    setCustomerLoading(true)
    const response = await fetch('/api/customers')
    const result = await response.json()
    setCustomers(Array.isArray(result) ? result : [])
    setCustomerLoading(false)
  }

  async function createCustomerLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeCampaign) return
    setFormError('')
    const data = new FormData(event.currentTarget)
    const response = await fetch('/api/growth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      type: 'customer_lead', campaignId: activeCampaign.id, customerId: data.get('customerId'), researchPurpose: data.get('researchPurpose'),
      researchQuestion: data.get('researchQuestion'), priority: data.get('priority'),
    }) })
    const result = await response.json()
    if (!response.ok) {
      setFormError(result.error || '클라이언트를 조사 후보로 추가하지 못했습니다.')
      return
    }
    setShowCustomerPicker(false)
    setTab('research')
    await load()
  }

  async function startTargetResearch() {
    if (!activeCampaign || researchStarting) return
    setResearchStarting(true)
    setResearchError('')
    const batchTotal = 3
    const batchId = crypto.randomUUID()
    for (let batchIndex = 1; batchIndex <= batchTotal; batchIndex += 1) {
      setResearchProgress({ current: batchIndex, total: batchTotal })
      const queueResponse = await fetch('/api/growth/research-runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId: activeCampaign.id, batchId, batchIndex, batchTotal }) })
      const queueResult = await queueResponse.json()
      if (!queueResponse.ok) {
        setResearchError(queueResult.error || `${batchIndex}/${batchTotal} 기업 조사 실행을 시작하지 못했습니다.`)
        await load()
        break
      }
      const response = await fetch('/api/automations/growth-target-research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId: queueResult.data.id }) })
      const result = await response.json()
      await load()
      if (!response.ok) {
        setResearchError(result.error || `${batchIndex}/${batchTotal} 기업 조사에 실패했습니다. 실행 기록에서 원인을 확인하세요.`)
        break
      }
    }
    setResearchProgress(null)
    setResearchStarting(false)
  }

  async function startDiscovery() {
    if (!activeCampaign || discoveryStarting) return
    setDiscoveryStarting(true); setResearchError('')
    const queued = await fetch('/api/growth/discovery-runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId: activeCampaign.id, targetCount: 20 }) })
    const queuedResult = await queued.json()
    if (!queued.ok) { setResearchError(queuedResult.error || '기업 탐색을 시작하지 못했습니다.'); setDiscoveryStarting(false); return }
    const executed = await fetch('/api/automations/growth-prospect-discovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId: queuedResult.data.id }) })
    const executedResult = await executed.json()
    if (!executed.ok) setResearchError(executedResult.error || '기업 탐색에 실패했습니다. 실행 기록을 확인하세요.')
    await load(); setDiscoveryStarting(false)
  }

  function toggleProspect(id: string) {
    setSelectedProspects((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function researchSelectedProspects() {
    if (bulkResearchProgress || selectedProspects.length === 0) return
    const targets = discovered.filter((lead) => selectedProspects.includes(lead.id))
    setResearchError('')
    for (let index = 0; index < targets.length; index += 1) {
      const lead = targets[index]
      setBulkResearchProgress({ current: index + 1, total: targets.length, company: lead.companyName })
      const queued = await fetch(`/api/growth/leads/${lead.id}/research-runs`, { method: 'POST' })
      const queuedResult = await queued.json()
      if (!queued.ok) { setResearchError(`${lead.companyName}: ${queuedResult.error || '정밀 조사 대기열 생성 실패'}`); break }
      const executed = await fetch('/api/automations/growth-target-research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId: queuedResult.data.id }) })
      const executedResult = await executed.json()
      if (!executed.ok) { setResearchError(`${lead.companyName}: ${executedResult.error || '정밀 조사 실패'}`); break }
      await load()
    }
    setSelectedProspects([]); setBulkResearchProgress(null); await load(); setTab('research')
  }

  async function reviewLead(id: string, reviewStatus: string) {
    await fetch(`/api/growth/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewStatus }) })
    await load()
  }

  async function reResearchLead(id: string) {
    if (researchingLeadId) return
    setResearchingLeadId(id)
    setResearchError('')
    const queueResponse = await fetch(`/api/growth/leads/${id}/research-runs`, { method: 'POST' })
    const queueResult = await queueResponse.json()
    if (!queueResponse.ok) {
      setResearchError(queueResult.error || '기업 재조사를 시작하지 못했습니다.')
      setResearchingLeadId('')
      return
    }
    const response = await fetch('/api/automations/growth-target-research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId: queueResult.data.id }) })
    const result = await response.json()
    if (!response.ok) setResearchError(result.error || '기업 재조사에 실패했습니다. 실행 기록에서 원인을 확인해 주세요.')
    await load()
    setSelectedLead(null)
    setResearchingLeadId('')
  }

  async function moveLead(id: string, stage: string) {
    await fetch(`/api/growth/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage }) })
    await load()
  }

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draftLead) return
    const data = new FormData(event.currentTarget)
    await fetch('/api/growth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      type: 'outreach_draft', leadId: draftLead.id, channel: data.get('channel'), language: data.get('language'), subject: data.get('subject'),
      body: data.get('body'), rationale: data.get('rationale'),
    }) })
    setDraftLead(null)
    await load()
  }

  const copy = workspaceCopy[workspace]
  const criteria = activeCampaign ? safeCriteria(activeCampaign.successCriteria) : {}

  return (
    <div className="mx-auto min-h-screen max-w-[1700px] px-4 py-7 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-5 border-b border-cyan-300/10 pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300"><Target className="h-4 w-4" /> Growth workspace</div>
          <h1 className="text-3xl font-bold text-white">사업 가설을 계약까지 이동시키는 곳</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">조사 결과를 사실처럼 자동 채택하지 않습니다. 근거를 확인하고, 사람이 적합도를 판단한 리드만 파이프라인과 접근 초안으로 이동합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['bridge', 'fairtale'] as const).map((key) => <button key={key} onClick={() => setWorkspace(key)} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${workspace === key ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-50' : 'border-slate-700 text-slate-400'}`}>{workspaceCopy[key].label}</button>)}
        </div>
      </header>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-cyan-300/15 bg-slate-950/65 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <FlaskConical className="h-5 w-5 flex-shrink-0 text-violet-300" />
          <div className="min-w-0"><p className="text-xs text-slate-500">현재 검증 캠페인</p><p className="truncate font-semibold text-white">{activeCampaign?.name || '아직 캠페인이 없습니다'}</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {campaigns.length > 1 && <select value={activeCampaign?.id || ''} onChange={(e) => setCampaignId(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{campaigns.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
          <button onClick={() => setShowCampaignForm(true)} className="flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100"><Plus className="h-4 w-4" /> 캠페인</button>
          <button onClick={() => load()} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-700 text-slate-300" aria-label="새로고침"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>

      <nav className="mb-5 flex gap-2 overflow-x-auto">
        {[['discovery', `기업 탐색 ${discovered.length}`], ['research', `정밀 조사 ${pending.length}`], ['pipeline', `영업 진행 ${qualified.length}`], ['overview', '캠페인·기록']].map(([key, label]) => <button key={key} onClick={() => setTab(key as typeof tab)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === key ? 'bg-white text-slate-950' : 'border border-slate-700 text-slate-400'}`}>{label}</button>)}
      </nav>

      {loading ? <div className="grid min-h-72 place-items-center text-slate-500">불러오는 중...</div> : !activeCampaign ? (
        <section className="rounded-3xl border border-dashed border-cyan-300/25 bg-slate-950/55 p-10 text-center"><FlaskConical className="mx-auto h-9 w-9 text-violet-300" /><h2 className="mt-4 text-xl font-semibold text-white">첫 사업 가설을 등록하세요</h2><p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-400">추천 문구를 기본값으로 준비했습니다. 대표가 검토해 캠페인을 생성하면 조사 후보와 고객 반응을 같은 기준으로 축적할 수 있습니다.</p><button onClick={() => setShowCampaignForm(true)} className="mt-5 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950">추천 캠페인 검토</button></section>
      ) : tab === 'discovery' ? (
        <DiscoveryWorkspace
          leads={leads} discovered={discovered} screeningPassed={screeningPassed} reviewNeeded={reviewNeeded} held={held} detailed={detailed} qualified={qualified}
          selected={selectedProspects} discoveryStarting={discoveryStarting} bulkProgress={bulkResearchProgress} error={researchError}
          onToggle={toggleProspect} onSelectPassed={() => setSelectedProspects(screeningPassed.map((lead) => lead.id))}
          onStartDiscovery={startDiscovery} onResearchSelected={researchSelectedProspects}
        />
      ) : tab === 'overview' ? (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/65 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-violet-300">검증 중인 가설</p><h2 className="mt-3 text-xl font-semibold leading-8 text-white">{activeCampaign.hypothesis}</h2><div className="mt-6 grid gap-3 sm:grid-cols-2"><Info label="타깃" value={activeCampaign.targetAudience} /><Info label="제안 상품" value={activeCampaign.offer || '미정'} /></div></section>
          <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/65 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">현재 병목</p><h2 className="mt-3 text-xl font-semibold text-white">{researchProgress ? `${researchProgress.current}/${researchProgress.total}번째 업체 분석 중` : leads.length === 0 ? '검토할 타깃 기업이 없습니다.' : pending.length > 0 ? `조사 후보 ${pending.length}곳의 사람 검토가 필요합니다.` : qualified.length === 0 ? '적합 판정을 받은 기업이 없습니다.' : '적합 기업의 다음 접촉 행동을 준비하세요.'}</h2>{researchProgress && <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${((researchProgress.current - 1) / researchProgress.total) * 100}%` }} /></div>}<div className="mt-5 flex flex-wrap gap-3"><button onClick={() => setTab(leads.length === 0 || pending.length > 0 ? 'research' : 'pipeline')} className="flex items-center gap-2 text-sm font-semibold text-cyan-200">다음 작업으로 이동 <ArrowRight className="h-4 w-4" /></button><button onClick={startTargetResearch} disabled={researchStarting || activeCampaign.researchRuns.some((run) => run.status === 'running')} className="flex items-center gap-2 text-sm font-semibold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"><Search className="h-4 w-4" /> {researchProgress ? `${researchProgress.current}/${researchProgress.total} 업체 분석 중...` : activeCampaign.researchRuns.some((run) => run.status === 'scheduled') ? '대기 중인 조사 실행' : 'AI 타깃 조사 시작 (3개)'}</button><button onClick={openCustomerPicker} className="flex items-center gap-2 text-sm font-semibold text-violet-200"><Building2 className="h-4 w-4" /> 기존 클라이언트에서 추가</button></div>{researchError && <p className="mt-3 text-xs text-rose-300">{researchError}</p>}</section>
          <section className="xl:col-span-2 rounded-2xl border border-cyan-300/15 bg-slate-950/65 p-5"><div className="grid gap-3 sm:grid-cols-5">{Object.entries(metrics).map(([key, value]) => <div key={key} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs uppercase text-slate-500">{key}</p><p className="mt-2 text-2xl font-semibold text-white">{value}<span className="ml-1 text-xs text-slate-600">/ {criteria[key] || '—'}</span></p></div>)}</div></section>
          <ResearchRunHistory runs={activeCampaign.researchRuns} />
        </div>
      ) : tab === 'research' ? (
        <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/65">
          <div className="flex flex-col gap-4 border-b border-cyan-300/10 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-white">기업 검토</h2><p className="mt-1 text-xs text-slate-500">핵심 신호를 먼저 보고, 상세 근거를 확인한 뒤 영업 후보 여부를 결정합니다.</p></div><div className="flex flex-wrap gap-2"><button onClick={openCustomerPicker} className="flex items-center gap-2 rounded-xl border border-violet-300/25 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-100"><Building2 className="h-4 w-4" /> 기존 클라이언트에서 추가</button><button onClick={() => setShowLeadForm(true)} className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950"><Plus className="h-4 w-4" /> 직접 후보 추가</button></div></div>
          <div className="space-y-3 p-5">{pending.length === 0 ? <Empty text="검토 대기 중인 조사 후보가 없습니다." /> : pending.map((lead) => <ResearchCard key={lead.id} lead={lead} onOpen={setSelectedLead} onReview={reviewLead} onResearch={reResearchLead} researching={researchingLeadId === lead.id} />)}</div>
        </section>
      ) : (
        <div className="overflow-x-auto pb-4"><div className="grid min-w-[1450px] grid-cols-8 gap-3">{stages.map(([key, label]) => <section key={key} className="rounded-2xl border border-cyan-300/12 bg-slate-950/65"><div className="border-b border-cyan-300/10 px-3 py-3"><p className="text-xs font-semibold text-slate-200">{label}</p><p className="mt-1 text-[11px] text-slate-600">{leads.filter((lead) => lead.stage === key).length}</p></div><div className="space-y-2 p-2">{leads.filter((lead) => lead.stage === key).map((lead) => <LeadCard key={lead.id} lead={lead} onMove={moveLead} onDraft={setDraftLead} />)}</div></section>)}</div></div>
      )}

      {showCampaignForm && <Modal title="사업 가설 캠페인" onClose={() => setShowCampaignForm(false)}><form onSubmit={createCampaign} className="space-y-4"><Field name="name" label="캠페인 이름" defaultValue={copy.campaign} /><TextField name="hypothesis" label="검증할 가설" defaultValue={copy.hypothesis} /><TextField name="targetAudience" label="우선 타깃" defaultValue={copy.target} /><Field name="offer" label="제안 상품" defaultValue={copy.offer} /><Submit label="캠페인 시작" /></form></Modal>}
      {showLeadForm && <Modal title="조사 후보 직접 추가" onClose={() => setShowLeadForm(false)}><form onSubmit={createLead} className="grid gap-4 sm:grid-cols-2"><Field name="companyName" label="기업명" required /><Field name="website" label="웹사이트" /><Field name="country" label="국가" defaultValue="DE" /><Field name="industry" label="업종" /><Field name="sourceUrl" label="원본 출처 URL" /><Field name="fitScore" label="초기 적합도 0–100" type="number" defaultValue="50" /><SelectField name="researchPurpose" label="조사 목적" options={[['신규 고객 가능성', '신규 고객 가능성'], ['추가 서비스 제안', '추가 서비스 제안'], ['재계약 가능성 조사', '재계약 가능성 조사'], ['관계 회복', '관계 회복'], ['소개·파트너십 가능성', '소개·파트너십 가능성'], ['Fair Tale 참여 가능성', 'Fair Tale 참여 가능성']]} /><SelectField name="priority" label="우선순위" options={[['normal', '보통'], ['high', '높음'], ['low', '낮음']]} /><div className="sm:col-span-2"><TextField name="researchQuestion" label="이번 조사에서 알고 싶은 점" /><TextField name="researchSummary" label="조사 요약" /><TextField name="evidence" label="선정 근거" /><TextField name="uncertainties" label="불확실하거나 추가 확인할 점" /></div><div className="sm:col-span-2"><Submit label="검토 대기에 추가" /></div></form></Modal>}
      {showCustomerPicker && <Modal title="기존 클라이언트에서 조사 후보 추가" onClose={() => setShowCustomerPicker(false)}>{customerLoading ? <div className="grid min-h-40 place-items-center text-sm text-slate-500">클라이언트를 불러오는 중...</div> : customers.length === 0 ? <Empty text="등록된 클라이언트가 없습니다." /> : <form onSubmit={createCustomerLead} className="space-y-4"><SelectField name="customerId" label="클라이언트" required options={customers.map((customer) => [customer.id, `${customer.company || customer.name} · ${customer.customerNumber}`])} /><SelectField name="researchPurpose" label="조사 목적" options={[['추가 서비스 제안', '추가 서비스 제안'], ['재계약 가능성 조사', '재계약 가능성 조사'], ['관계 회복', '관계 회복'], ['소개·파트너십 가능성', '소개·파트너십 가능성'], ['Fair Tale 참여 가능성', 'Fair Tale 참여 가능성']]} /><SelectField name="priority" label="우선순위" options={[['normal', '보통'], ['high', '높음'], ['low', '낮음']]} /><TextField name="researchQuestion" label="이번 조사에서 알고 싶은 점" />{formError && <p className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-100">{formError}</p>}<div className="rounded-xl border border-cyan-300/15 bg-cyan-400/5 p-3 text-xs leading-5 text-cyan-100">고객 원본은 복사하지 않고 연결합니다. Growth에는 조사 목적과 판정 결과만 별도로 쌓입니다.</div><Submit label="조사 후보로 연결" /></form>}</Modal>}
      {selectedLead && <ResearchDetail lead={selectedLead} onClose={() => setSelectedLead(null)} onReview={(id, status) => { setSelectedLead(null); void reviewLead(id, status) }} onResearch={reResearchLead} researching={researchingLeadId === selectedLead.id} />}
      {draftLead && <Modal title={`${draftLead.companyName} 접근 초안`} onClose={() => setDraftLead(null)}><form onSubmit={createDraft} className="space-y-4"><div className="grid grid-cols-2 gap-3"><Field name="channel" label="채널" defaultValue="LinkedIn" /><Field name="language" label="언어" defaultValue="de" /></div><Field name="subject" label="제목 (선택)" /><TextField name="body" label="메시지 본문" required /><TextField name="rationale" label="이 메시지가 적합한 이유" /><div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">저장하면 Approval Inbox로 이동합니다. 승인되어도 자동 발송되지 않으며 최종안만 확정됩니다.</div><Submit label="승인 요청 만들기" /></form></Modal>}
    </div>
  )
}

function DiscoveryWorkspace(props: {
  leads: Lead[]; discovered: Lead[]; screeningPassed: Lead[]; reviewNeeded: Lead[]; held: Lead[]; detailed: Lead[]; qualified: Lead[]
  selected: string[]; discoveryStarting: boolean; bulkProgress: { current: number; total: number; company: string } | null; error: string
  onToggle: (id: string) => void; onSelectPassed: () => void; onStartDiscovery: () => void; onResearchSelected: () => void
}) {
  const { leads, discovered, screeningPassed, reviewNeeded, held, detailed, qualified, selected, discoveryStarting, bulkProgress, error, onToggle, onSelectPassed, onStartDiscovery, onResearchSelected } = props
  const solReviewed = leads.filter((lead) => lead.sourceType === 'ai_sol_review').length
  const funnel: Array<[string, string, number, string]> = [
    ['1', '후보 발굴', leads.length, '공식 목록과 공개 웹에서 넓게 수집'],
    ['2', '기본 확인', screeningPassed.length, `${reviewNeeded.length}곳 검토 필요 · ${held.length}곳 보류`],
    ['3', '정밀 조사', detailed.length, '선택한 기업만 Luna 조사'],
    ['4', '중요 재검증', solReviewed, '필요한 기업만 Sol 승인'],
    ['5', '접근 준비', qualified.length, '사람이 영업 후보로 채택'],
  ]
  return <div className="space-y-5">
    <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/65 p-5">
      <div className="grid gap-3 md:grid-cols-5">{funnel.map(([number, label, count, description], index) => <div key={number} className="relative rounded-xl border border-slate-800 bg-slate-900/65 p-4">
        <div className="flex items-center justify-between"><span className="grid h-7 w-7 place-items-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-200">{number}</span><span className="text-xl font-semibold text-white">{count}</span></div>
        <p className="mt-3 text-sm font-semibold text-slate-100">{label}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{description}</p>
        {index < 4 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-slate-600 md:block" />}
      </div>)}</div>
    </section>
    <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/65">
      <div className="flex flex-col gap-4 border-b border-cyan-300/10 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="font-semibold text-white">기업 후보함</h2><p className="mt-1 text-xs leading-5 text-slate-500">넓게 찾고 기본 조건만 확인합니다. 기업은 자동 삭제하지 않으며 사람이 선택한 기업만 정밀 조사합니다.</p></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onSelectPassed} disabled={screeningPassed.length === 0} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 disabled:opacity-40">통과 기업 전체 선택</button>
          <button onClick={onResearchSelected} disabled={selected.length === 0 || Boolean(bulkProgress)} className="rounded-xl bg-violet-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">{bulkProgress ? `${bulkProgress.current}/${bulkProgress.total} ${bulkProgress.company} 조사 중` : `선택 기업 정밀 조사${selected.length ? ` (${selected.length})` : ''}`}</button>
          <button onClick={onStartDiscovery} disabled={discoveryStarting} className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40"><Search className="h-4 w-4" />{discoveryStarting ? '후보 발굴·기본 확인 중...' : '기업 탐색 시작'}</button>
        </div>
      </div>
      {error && <p className="mx-5 mt-4 rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-100">{error}</p>}
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-slate-800 text-xs text-slate-500"><tr><th className="p-4">선택</th><th className="p-4">기업</th><th className="p-4">발견 근거</th><th className="p-4">기본 확인</th><th className="p-4">출처</th><th className="p-4">다음 작업</th></tr></thead>
        <tbody>{discovered.length === 0 ? <tr><td colSpan={6} className="p-10 text-center text-slate-500">아직 후보가 없습니다. 기업 탐색 시작을 누르면 후보 발굴과 기본 확인까지만 자동 실행합니다.</td></tr> : discovered.map((lead) => <tr key={lead.id} className="border-b border-slate-800/70 align-top hover:bg-slate-900/45">
          <td className="p-4"><input type="checkbox" checked={selected.includes(lead.id)} onChange={() => onToggle(lead.id)} aria-label={`${lead.companyName} 선택`} className="h-4 w-4 accent-cyan-400" /></td>
          <td className="p-4"><p className="font-semibold text-white">{lead.companyName}</p><p className="mt-1 text-xs text-slate-500">{[lead.country, lead.industry].filter(Boolean).join(' · ') || '기본 정보 확인 필요'}</p>{lead.website && <a href={lead.website} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-200"><ExternalLink className="h-3 w-3" />공식 사이트</a>}</td>
          <td className="max-w-md p-4 text-xs leading-5 text-slate-300">{lead.evidence || '발견 이유 기록 없음'}</td>
          <td className="p-4"><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${lead.reviewStatus === 'screening_passed' ? 'bg-emerald-400/10 text-emerald-200' : lead.reviewStatus === 'review_needed' ? 'bg-amber-400/10 text-amber-200' : 'bg-slate-700/60 text-slate-300'}`}>{lead.reviewStatus === 'screening_passed' ? '통과' : lead.reviewStatus === 'review_needed' ? '검토 필요' : '보류'}</span>{lead.uncertainties && <p className="mt-2 max-w-xs text-[11px] leading-5 text-slate-500">{lead.uncertainties}</p>}</td>
          <td className="p-4 text-xs text-slate-300">{lead.sourceCount}개</td><td className="p-4 text-xs leading-5 text-cyan-200">{lead.nextAction}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </div>
}

function ResearchRunHistory({ runs }: { runs: ResearchRun[] }) {
  const labels: Record<string, string> = { scheduled: '대기', running: '조사 중', completed: '완료', failed: '실패', cancelled: '취소', waiting_approval: '승인 대기' }
  return <section className="xl:col-span-2 rounded-2xl border border-cyan-300/15 bg-slate-950/65 p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-white">AI 조사 실행 기록</h2><p className="mt-1 text-xs leading-5 text-slate-500">캠페인 입력, 실행 상태, 결과와 실패를 삭제하지 않고 남깁니다.</p></div><span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">최근 {runs.length}건</span></div><div className="mt-4 space-y-3">{runs.length === 0 ? <div className="rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-500">아직 AI 조사 실행 기록이 없습니다.</div> : runs.map((run) => { let input: { requestedBy?: string; limitations?: string[]; batchIndex?: number; batchTotal?: number; campaignSnapshot?: { targetAudience?: string } } = {}; try { input = run.inputEvidence ? JSON.parse(run.inputEvidence) : {} } catch {} return <article key={run.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${run.status === 'failed' ? 'bg-rose-400' : run.status === 'completed' ? 'bg-emerald-400' : run.status === 'running' ? 'bg-cyan-400' : 'bg-amber-300'}`} /><p className="text-sm font-semibold text-white">{labels[run.status] || run.status}</p>{input.batchTotal && <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">{input.batchIndex}/{input.batchTotal} 업체</span>}<span className="text-xs text-slate-600">v{run.skillVersion}</span></div><time className="text-xs text-slate-500">{new Date(run.createdAt).toLocaleString('ko-KR')}</time></div><div className="mt-3 grid gap-2 text-xs leading-5 text-slate-400 sm:grid-cols-2"><p>요청자: <span className="text-slate-200">{input.requestedBy || '시스템'}</span></p><p>실행 방식: <span className="text-slate-200">{run.triggerType === 'manual' ? '사람이 직접 시작' : run.triggerType}</span></p><p className="sm:col-span-2">조사 대상: <span className="text-slate-200">{input.campaignSnapshot?.targetAudience || '캠페인 입력 참조'}</span></p></div>{run.status === 'scheduled' && input.limitations?.[0] && <p className="mt-3 rounded-lg border border-amber-300/15 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100">{input.limitations[0]}</p>}{run.error && <p className="mt-3 text-xs text-rose-300">실패: {run.error}</p>}{run.nextAction && <p className="mt-3 text-xs text-cyan-200">다음 행동: {run.nextAction}</p>}</article> })}</div></section>
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-sm leading-6 text-slate-200">{value}</p></div> }
function Empty({ text }: { text: string }) { return <div className="col-span-full grid min-h-40 place-items-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">{text}</div> }
function toList(value: string | null) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  } catch {}
  return value.split(/\n+/).map((item) => item.trim()).filter(Boolean)
}

function LegacyResearchCard({ lead, onOpen, onReview, onResearch, researching }: { lead: Lead; onOpen: (lead: Lead) => void; onReview: (id: string, status: string) => void; onResearch: (id: string) => void; researching: boolean }) {
  const facts = toList(lead.facts || lead.evidence)
  const unknowns = toList(lead.uncertainties)
  const evidenceLabel = lead.sourceCount >= 2 ? '복수 출처' : lead.sourceCount === 1 ? '출처 1개 · 보완 필요' : '출처 없음'

  return <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-cyan-300/20">
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-white">{lead.companyName}</h3>
          {lead.customer && <span className="rounded-full bg-violet-400/10 px-2 py-1 text-[10px] font-semibold text-violet-200">기존 클라이언트</span>}
          {lead.priority === 'high' && <span className="rounded-full bg-rose-400/10 px-2 py-1 text-[10px] font-semibold text-rose-200">우선 검토</span>}
        </div>
        <p className="mt-1 text-xs text-slate-500">{[lead.country, lead.industry].filter(Boolean).join(' · ') || '기본정보 미확인'}</p>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{lead.researchSummary || facts[0] || '아직 조사 요약이 없습니다.'}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {facts.slice(0, 2).map((fact) => <span key={fact} className="max-w-full truncate rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-1.5 text-slate-300">{fact}</span>)}
        </div>
        {unknowns[0] && <p className="mt-3 truncate text-xs text-amber-200">확인 필요 · {unknowns[0]}</p>}
      </div>

      <div className="grid grid-cols-3 gap-2 lg:grid-cols-3">
        <Metric label="우리와 적합" value={lead.fitScore} />
        <Metric label="근거 신뢰도" value={lead.confidence} />
        <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">조사 상태</p>
          <p className={`mt-2 text-xs font-semibold ${lead.sourceCount >= 2 ? 'text-emerald-200' : 'text-amber-200'}`}>{evidenceLabel}</p>
        </div>
      </div>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
      <button onClick={() => onOpen(lead)} className="rounded-lg border border-cyan-300/20 bg-cyan-400/5 px-3 py-2 text-xs font-semibold text-cyan-100">상세 근거 보기</button>
      <button disabled={researching} onClick={() => onResearch(lead.id)} className="flex items-center gap-1.5 rounded-lg bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-200 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${researching ? 'animate-spin' : ''}`} /> {researching ? '재조사 중' : '이 기업 재조사'}</button>
      <button onClick={() => onReview(lead.id, 'qualified')} className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200"><Check className="h-3.5 w-3.5" /> 영업 후보로 채택</button>
      <button onClick={() => onReview(lead.id, 'info_needed')} className="flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200"><Search className="h-3.5 w-3.5" /> 추가 조사</button>
      <button onClick={() => onReview(lead.id, 'rejected')} className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-rose-500/10 hover:text-rose-200"><X className="h-3.5 w-3.5" /> 이번 가설에 부적합</button>
    </div>
  </article>
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/55 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold text-white">{value ?? '—'}<span className="ml-0.5 text-[10px] text-slate-600">/100</span></p></div>
}

function LegacyResearchDetail({ lead, onClose, onReview, onResearch, researching }: { lead: Lead; onClose: () => void; onReview: (id: string, status: string) => void; onResearch: (id: string) => void; researching: boolean }) {
  return <Modal title={`${lead.companyName} · 조사 상세`} onClose={onClose}>
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3"><Metric label="우리와 적합" value={lead.fitScore} /><Metric label="근거 신뢰도" value={lead.confidence} /></div>
      {lead.researchPurpose && <Info label="조사 목적" value={lead.researchPurpose} />}
      {lead.researchQuestion && <Info label="이번에 확인하려는 질문" value={lead.researchQuestion} />}
      {lead.researchSummary && <Info label="조사 요약" value={lead.researchSummary} />}
      <Info label="확인된 사실" value={parseStringList(lead.facts || lead.evidence || '확인된 사실이 없습니다.')} />
      {lead.inferences && <Info label="AI의 해석" value={parseStringList(lead.inferences)} />}
      {lead.uncertainties && <div className="rounded-xl border border-amber-300/15 bg-amber-400/5 p-4"><p className="text-xs font-semibold text-amber-200">추가 확인이 필요한 점</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-amber-50/90">{parseStringList(lead.uncertainties)}</p></div>}
      <div className="rounded-xl border border-slate-800 p-4"><p className="text-xs font-semibold text-slate-400">원본 출처 · {lead.researchSources.length || (lead.sourceUrl ? 1 : 0)}개</p><div className="mt-3 space-y-2">{lead.researchSources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 text-xs leading-5 text-cyan-200 hover:text-cyan-100"><ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" /><span>{source.title}</span></a>)}{lead.researchSources.length === 0 && lead.sourceUrl && <a href={lead.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-cyan-200"><ExternalLink className="h-3.5 w-3.5" /> 원본 출처 열기</a>}{lead.researchSources.length === 0 && !lead.sourceUrl && <p className="text-xs text-amber-200">연결된 출처가 없습니다.</p>}</div></div>
      <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-4"><button disabled={researching} onClick={() => onResearch(lead.id)} className="rounded-lg bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-200 disabled:opacity-50">{researching ? '재조사 중...' : '이 기업 재조사'}</button><button onClick={() => onReview(lead.id, 'qualified')} className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200">영업 후보로 채택</button><button onClick={() => onReview(lead.id, 'info_needed')} className="rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200">추가 조사</button><button onClick={() => onReview(lead.id, 'rejected')} className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200">이번 가설에 부적합</button></div>
    </div>
  </Modal>
}
const researchCategoryLabels: Record<string, string> = {
  company_identity: '회사·법인 기본 정보', business_products: '사업 분야와 제품', recent_changes: '최근 변화와 사업 신호',
  marketing_activity: '마케팅 활동', content_maturity: '기존 콘텐츠 수준', hiring_organization: '채용·조직 변화',
  events_exhibitions: '박람회·행사 일정', procurement_funding: '공개 입찰·지원사업', owner_access_path: '담당 조직·접근 경로',
  meeting_questions: '미팅에서 확인할 사항',
}
const researchStatusLabels: Record<string, string> = { confirmed: '확인 완료', not_found: '공개 정보 없음', needs_research: '추가 조사 필요' }
const overallStatusLabels: Record<string, string> = { insufficient: '근거 부족', partial: '일부 확인', review_ready: '사람 검토 가능' }

function parseStructuredResearch(value: string | null): StructuredResearch | null {
  if (!value) return null
  try { const parsed = JSON.parse(value) as StructuredResearch; return Array.isArray(parsed.items) ? parsed : null } catch { return null }
}

function ResearchCard(props: { lead: Lead; onOpen: (lead: Lead) => void; onReview: (id: string, status: string) => void; onResearch: (id: string) => void; researching: boolean }) {
  const { lead, onOpen, onReview, onResearch, researching } = props
  const structured = parseStructuredResearch(lead.researchDetails)
  if (!structured) return <LegacyResearchCard {...props} />
  return <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-cyan-300/20">
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-semibold text-white">{lead.companyName}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${structured.overallStatus === 'review_ready' ? 'bg-emerald-400/10 text-emerald-200' : 'bg-amber-400/10 text-amber-200'}`}>{overallStatusLabels[structured.overallStatus] || structured.overallStatus}</span></div><p className="mt-1 text-xs text-slate-500">{[lead.country, lead.industry].filter(Boolean).join(' · ') || '기본정보 미확인'} · 정책 {structured.policyVersion}</p><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{lead.researchSummary}</p>{structured.recommendedApproach && <p className="mt-3 text-xs leading-5 text-cyan-200">권장 접근 · {structured.recommendedApproach}</p>}</div><div className="grid grid-cols-2 gap-2"><Metric label="사업 기회" value={lead.opportunityScore} /><Metric label="우리와 적합" value={lead.fitScore} /><Metric label="실행 가능성" value={lead.actionabilityScore} /><Metric label="근거 신뢰도" value={lead.confidence} /></div></div>
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4"><button onClick={() => onOpen(lead)} className="rounded-lg border border-cyan-300/20 bg-cyan-400/5 px-3 py-2 text-xs font-semibold text-cyan-100">10개 항목 상세 보기</button><button disabled={researching} onClick={() => onResearch(lead.id)} className="flex items-center gap-1.5 rounded-lg bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-200 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${researching ? 'animate-spin' : ''}`} /> {researching ? '재조사 중' : '이 기업 재조사'}</button><button onClick={() => onReview(lead.id, 'qualified')} className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200"><Check className="h-3.5 w-3.5" /> 영업 후보로 채택</button><button onClick={() => onReview(lead.id, 'info_needed')} className="flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200"><Search className="h-3.5 w-3.5" /> 추가 조사</button><button onClick={() => onReview(lead.id, 'rejected')} className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-rose-500/10 hover:text-rose-200"><X className="h-3.5 w-3.5" /> 이번 가설에 부적합</button></div>
  </article>
}

function ResearchDetail(props: { lead: Lead; onClose: () => void; onReview: (id: string, status: string) => void; onResearch: (id: string) => void; researching: boolean }) {
  const { lead, onClose, onReview, onResearch, researching } = props
  const structured = parseStructuredResearch(lead.researchDetails)
  if (!structured) return <LegacyResearchDetail {...props} />
  const sourceByUrl = new Map(lead.researchSources.map((source) => [source.url, source]))
  return <Modal title={`${lead.companyName} · 항목별 조사`} onClose={onClose}><div className="space-y-3"><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="사업 기회" value={lead.opportunityScore} /><Metric label="우리와 적합" value={lead.fitScore} /><Metric label="실행 가능성" value={lead.actionabilityScore} /><Metric label="근거 신뢰도" value={lead.confidence} /></div><div className="rounded-xl border border-cyan-300/15 bg-cyan-400/5 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-cyan-100">{overallStatusLabels[structured.overallStatus] || structured.overallStatus}</p><span className="text-[11px] text-cyan-200/60">정책 {structured.policyVersion} · 공식 출처 {structured.officialSourceCount}개</span></div><p className="mt-2 text-sm leading-6 text-slate-200">{lead.researchSummary}</p>{structured.recommendedApproach && <p className="mt-2 text-xs leading-5 text-cyan-100">권장 접근 · {structured.recommendedApproach}</p>}</div>{structured.items.map((item) => <section key={item.category} className="rounded-xl border border-slate-800 bg-slate-950/45 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-white">{researchCategoryLabels[item.category] || item.category}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.status === 'confirmed' ? 'bg-emerald-400/10 text-emerald-200' : item.status === 'not_found' ? 'bg-slate-700/60 text-slate-300' : 'bg-amber-400/10 text-amber-200'}`}>{researchStatusLabels[item.status] || item.status}</span></div><p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p>{item.facts.length > 0 && <ResearchList label="확인된 사실" values={item.facts} tone="emerald" />}{item.inferences.length > 0 && <ResearchList label="AI 해석·가설" values={item.inferences} tone="cyan" />}{item.missingInformation.length > 0 && <ResearchList label="미확인 정보" values={item.missingInformation} tone="amber" />}{item.nextSearch && <p className="mt-3 text-xs leading-5 text-amber-200">다음 조사 · {item.nextSearch}</p>}{item.sourceUrls.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{item.sourceUrls.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/15 px-2 py-1 text-[11px] text-cyan-200"><ExternalLink className="h-3 w-3" />{sourceByUrl.get(url)?.title || '원본 출처'}</a>)}</div>}<p className="mt-3 text-[10px] text-slate-600">확인일 {item.checkedAt}</p></section>)}<div className="flex flex-wrap gap-2 border-t border-slate-800 pt-4"><button disabled={researching} onClick={() => onResearch(lead.id)} className="rounded-lg bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-200 disabled:opacity-50">{researching ? '재조사 중...' : '이 기업 재조사'}</button><button onClick={() => onReview(lead.id, 'qualified')} className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200">영업 후보로 채택</button><button onClick={() => onReview(lead.id, 'info_needed')} className="rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200">추가 조사</button><button onClick={() => onReview(lead.id, 'rejected')} className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200">이번 가설에 부적합</button></div></div></Modal>
}

function ResearchList({ label, values, tone }: { label: string; values: string[]; tone: 'emerald' | 'cyan' | 'amber' }) {
  const colors = { emerald: 'text-emerald-200', cyan: 'text-cyan-200', amber: 'text-amber-200' }
  return <div className="mt-3"><p className={`text-[11px] font-semibold ${colors[tone]}`}>{label}</p><ul className="mt-1 space-y-1 text-xs leading-5 text-slate-300">{values.map((value) => <li key={value} className="flex gap-2"><span className="text-slate-600">•</span><span>{value}</span></li>)}</ul></div>
}

function LeadCard({ lead, onMove, onDraft }: { lead: Lead; onMove: (id: string, stage: string) => void; onDraft: (lead: Lead) => void }) { const index = stages.findIndex(([key]) => key === lead.stage); const latest = lead.outreachDrafts[0]; return <article className="rounded-xl border border-slate-800 bg-slate-900/75 p-3"><p className="text-xs font-semibold text-white">{lead.companyName}</p><p className="mt-1 text-[11px] text-slate-500">적합도 {lead.fitScore ?? '—'} · {lead.industry || '업종 미정'}</p>{latest && <p className={`mt-2 text-[11px] ${latest.status === 'approved' ? 'text-emerald-300' : 'text-amber-300'}`}>메시지: {latest.status}</p>}<div className="mt-3 flex gap-1">{lead.stage === 'qualified' && <button onClick={() => onDraft(lead)} className="grid h-8 w-8 place-items-center rounded-lg bg-violet-400/15 text-violet-200" title="메시지 초안"><Send className="h-3.5 w-3.5" /></button>}{index < stages.length - 1 && <button onClick={() => onMove(lead.id, stages[index + 1][0])} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-cyan-400/10 text-[11px] font-semibold text-cyan-200">다음 <ArrowRight className="h-3 w-3" /></button>}</div></article> }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"><section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cyan-300/20 bg-[#08111f] p-5 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{title}</h2><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-700 text-slate-300"><X className="h-4 w-4" /></button></div>{children}</section></div> }
function Field({ name, label, defaultValue, required, type = 'text' }: { name: string; label: string; defaultValue?: string; required?: boolean; type?: string }) { return <label className="block text-xs font-semibold text-slate-400">{label}<input name={name} type={type} defaultValue={defaultValue} required={required} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none" /></label> }
function SelectField({ name, label, options, required }: { name: string; label: string; options: Array<readonly [string, string]>; required?: boolean }) { return <label className="block text-xs font-semibold text-slate-400">{label}<select name={name} required={required} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none">{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label> }
function TextField({ name, label, defaultValue, required }: { name: string; label: string; defaultValue?: string; required?: boolean }) { return <label className="mt-3 block text-xs font-semibold text-slate-400">{label}<textarea name={name} defaultValue={defaultValue} required={required} rows={3} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm leading-6 text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none" /></label> }
function Submit({ label }: { label: string }) { return <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950"><ShieldCheck className="h-4 w-4" /> {label}</button> }

import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { COMPANY_CONSTITUTION_VERSION } from '@/lib/company-policy'
import { deriveResearchOverallStatus, RESEARCH_POLICY_VERSION, researchCategories } from '@/lib/research/research-policy'

const SKILL_VERSION = '0.4.1'
const RESEARCH_MODEL = process.env.OPENAI_RESEARCH_MODEL || 'gpt-5.6-luna'
const REVIEW_MODEL = process.env.OPENAI_REVIEW_MODEL || 'gpt-5.6-sol'
const RESEARCH_MAX_OUTPUT_TOKENS = Number(process.env.OPENAI_RESEARCH_MAX_OUTPUT_TOKENS || 6000)
const RESEARCH_MAX_TOOL_CALLS = Number(process.env.OPENAI_RESEARCH_MAX_TOOL_CALLS || 6)
const REVIEW_MAX_TOOL_CALLS = Number(process.env.OPENAI_REVIEW_MAX_TOOL_CALLS || 8)
const RESEARCH_REASONING = process.env.OPENAI_RESEARCH_REASONING || 'low'
const REVIEW_REASONING = process.env.OPENAI_REVIEW_REASONING || 'medium'

const categoryKeys = researchCategories.map((category) => category.key)
const ResearchItemSchema = z.object({
  category: z.enum(categoryKeys as [typeof categoryKeys[number], ...typeof categoryKeys]),
  status: z.enum(['confirmed', 'not_found', 'needs_research']),
  summary: z.string(), facts: z.array(z.string()), inferences: z.array(z.string()),
  missingInformation: z.array(z.string()), sourceUrls: z.array(z.string().url()), nextSearch: z.string().nullable(),
})
const CandidateSchema = z.object({
  companyName: z.string().min(1), website: z.string().url().nullable(), country: z.string().nullable(), industry: z.string().nullable(),
  overallSummary: z.string(), researchItems: z.array(ResearchItemSchema), officialSourceUrls: z.array(z.string().url()),
  opportunityScore: z.number().int().min(0).max(100), fitScore: z.number().int().min(0).max(100),
  actionabilityScore: z.number().int().min(0).max(100), confidence: z.number().int().min(0).max(100),
  recommendedApproach: z.string(), sourceUrls: z.array(z.string().url()).min(1),
}).superRefine((candidate, context) => {
  const returned = new Set(candidate.researchItems.map((item) => item.category))
  for (const key of categoryKeys) if (!returned.has(key)) context.addIssue({ code: 'custom', message: `Missing research category: ${key}` })
})
const ResearchOutputSchema = z.object({ searchSummary: z.string(), candidates: z.array(CandidateSchema).max(3) })

type SearchSource = { url: string; title: string; excerpt: string | null; pageAge: string | null }
type RunInput = { targetLeadId?: string; batchIndex?: number; batchTotal?: number; excludedCompanies?: string[]; reviewMode?: boolean; requestedModel?: string; requestedBy?: string }
type OpenAIResponse = {
  id?: string; status?: string; incomplete_details?: { reason?: string } | null; error?: { message?: string } | null
  output?: Array<{
    type: string
    action?: { type?: string; url?: string; sources?: Array<{ type?: string; url?: string }> }
    content?: Array<{ type: string; text?: string; annotations?: Array<{ type: string; url?: string; title?: string; url_citation?: { url?: string; title?: string } }> }>
  }>
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number; input_tokens_details?: { cached_tokens?: number }; output_tokens_details?: { reasoning_tokens?: number } }
}

const outputJsonSchema = {
  type: 'object', additionalProperties: false, required: ['searchSummary', 'candidates'], properties: {
    searchSummary: { type: 'string' }, candidates: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['companyName', 'website', 'country', 'industry', 'overallSummary', 'researchItems', 'officialSourceUrls', 'opportunityScore', 'fitScore', 'actionabilityScore', 'confidence', 'recommendedApproach', 'sourceUrls'],
      properties: {
        companyName: { type: 'string' }, website: { type: ['string', 'null'] }, country: { type: ['string', 'null'] }, industry: { type: ['string', 'null'] }, overallSummary: { type: 'string' },
        researchItems: { type: 'array', items: { type: 'object', additionalProperties: false,
          required: ['category', 'status', 'summary', 'facts', 'inferences', 'missingInformation', 'sourceUrls', 'nextSearch'], properties: {
            category: { type: 'string', enum: categoryKeys }, status: { type: 'string', enum: ['confirmed', 'not_found', 'needs_research'] }, summary: { type: 'string' },
            facts: { type: 'array', items: { type: 'string' } }, inferences: { type: 'array', items: { type: 'string' } }, missingInformation: { type: 'array', items: { type: 'string' } },
            sourceUrls: { type: 'array', items: { type: 'string' } }, nextSearch: { type: ['string', 'null'] },
          },
        } },
        officialSourceUrls: { type: 'array', items: { type: 'string' } }, opportunityScore: { type: 'integer' }, fitScore: { type: 'integer' }, actionabilityScore: { type: 'integer' },
        confidence: { type: 'integer' }, recommendedApproach: { type: 'string' }, sourceUrls: { type: 'array', items: { type: 'string' } },
      },
    } },
  },
} as const

function normalizeUrl(value: string) { try { const url = new URL(value); url.hash = ''; return url.toString().replace(/\/$/, '') } catch { return value.replace(/\/$/, '') } }
function hash(value: string) { return crypto.createHash('sha256').update(value).digest('hex') }
function reviewRequiresApproval() { return process.env.OPENAI_REVIEW_REQUIRES_APPROVAL !== 'false' }
function estimateCostUsd(model: string, usage: OpenAIResponse['usage'], webSearchCalls: number) {
  const rates = model.includes('sol') ? { input: 5, output: 30 } : { input: 1, output: 6 }
  return Number((((usage?.input_tokens || 0) / 1_000_000) * rates.input + ((usage?.output_tokens || 0) / 1_000_000) * rates.output + webSearchCalls * 0.01).toFixed(6))
}

async function requestOpenAI(model: string, maxToolCalls: number, reasoningEffort: string, systemPrompt: string, userPrompt: string) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.')
  const apiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, instructions: systemPrompt, input: userPrompt, tools: [{ type: 'web_search', user_location: { type: 'approximate', country: 'DE', timezone: 'Europe/Berlin' } }],
      include: ['web_search_call.action.sources'],
      max_tool_calls: maxToolCalls, reasoning: { effort: reasoningEffort }, max_output_tokens: RESEARCH_MAX_OUTPUT_TOKENS,
      text: { format: { type: 'json_schema', name: 'growth_company_research', strict: true, schema: outputJsonSchema } }, store: false }),
  })
  const response = await apiResponse.json() as OpenAIResponse
  if (!apiResponse.ok) throw new Error(`OpenAI 조사 요청 실패 (${apiResponse.status}): ${response.error?.message || '알 수 없는 오류'}`)
  if (response.status === 'incomplete') throw new Error(`AI 조사 결과가 완료되지 않았습니다: ${response.incomplete_details?.reason || 'unknown'}`)
  return response
}

async function createSolApproval(lead: { id: string; companyName: string; campaignId: string; opportunityScore: number | null; fitScore: number | null; confidence: number | null; researchOverallStatus: string | null }, runInput: RunInput, workspace: string) {
  if (!reviewRequiresApproval()) return null
  const important = Math.max(lead.opportunityScore || 0, lead.fitScore || 0) >= 70
  const needsVerification = (lead.confidence || 0) < 70 || lead.researchOverallStatus !== 'review_ready'
  if (!important || !needsVerification) return null
  const duplicate = await prisma.approvalRequest.findFirst({ where: { actionType: 'growth_sol_research', status: 'pending', proposedPayload: { contains: `\"leadId\":\"${lead.id}\"` } } })
  if (duplicate) return duplicate
  const reason = `중요도는 높지만 신뢰도 또는 조사 완성도가 부족합니다. (기회 ${lead.opportunityScore || 0}, 적합 ${lead.fitScore || 0}, 신뢰 ${lead.confidence || 0})`
  return prisma.$transaction(async (tx) => {
    const approval = await tx.approvalRequest.create({ data: {
      title: `${lead.companyName} Sol 정밀 재검증`, summary: reason, actionType: 'growth_sol_research', workspace, riskLevel: 'medium',
      evidence: JSON.stringify({ leadId: lead.id, researchOverallStatus: lead.researchOverallStatus, opportunityScore: lead.opportunityScore, fitScore: lead.fitScore, confidence: lead.confidence }),
      proposedPayload: JSON.stringify({ leadId: lead.id, campaignId: lead.campaignId, requestedModel: REVIEW_MODEL, maxToolCalls: REVIEW_MAX_TOOL_CALLS, reason }),
      requestedBy: runInput.requestedBy || 'AI research policy', constitutionVersion: COMPANY_CONSTITUTION_VERSION,
    } })
    await tx.automationRun.create({ data: {
      skillKey: 'growth-target-research', skillVersion: SKILL_VERSION, workspace, campaignId: lead.campaignId, triggerType: 'human_approval',
      triggerKey: `growth-sol-review:${lead.id}:${crypto.randomUUID()}`, status: 'waiting_approval', approvalRequestId: approval.id,
      inputEvidence: JSON.stringify({ requestedBy: runInput.requestedBy, targetLeadId: lead.id, reviewMode: true, requestedModel: REVIEW_MODEL, approvalReason: reason }),
      nextAction: '사람이 승인하면 Sol 정밀 재검증을 실행합니다.', constitutionVersion: COMPANY_CONSTITUTION_VERSION,
    } })
    return approval
  })
}

export async function executeGrowthTargetResearch(runId: string) {
  const claimed = await prisma.automationRun.updateMany({ where: { id: runId, skillKey: 'growth-target-research', status: 'scheduled' }, data: { status: 'running', startedAt: new Date(), error: null } })
  if (claimed.count !== 1) { const run = await prisma.automationRun.findUnique({ where: { id: runId } }); if (!run) throw new Error('Research run not found'); return run }
  try {
    const run = await prisma.automationRun.findUnique({ where: { id: runId }, include: { campaign: true } })
    if (!run?.campaign) throw new Error('Research campaign not found')
    const campaign = run.campaign
    const runInput = run.inputEvidence ? JSON.parse(run.inputEvidence) as RunInput : {}
    const targetLead = runInput.targetLeadId ? await prisma.growthLead.findFirst({ where: { id: runInput.targetLeadId, campaignId: campaign.id } }) : null
    if (runInput.targetLeadId && !targetLead) throw new Error('Target company not found in this campaign')
    if (runInput.reviewMode && run.triggerType !== 'human_approval') throw new Error('Sol 검증은 사람 승인 실행에서만 허용됩니다.')
    const model = runInput.reviewMode ? REVIEW_MODEL : RESEARCH_MODEL
    if (runInput.reviewMode && runInput.requestedModel !== model) throw new Error('승인된 Sol 모델과 현재 설정이 일치하지 않습니다. 새 승인이 필요합니다.')
    const maxToolCalls = runInput.reviewMode ? REVIEW_MAX_TOOL_CALLS : RESEARCH_MAX_TOOL_CALLS
    const reasoningEffort = runInput.reviewMode ? REVIEW_REASONING : RESEARCH_REASONING
    const targetInstruction = targetLead ? `\n\nIMPORTANT TARGET MODE:\nRe-research exactly this existing company and return exactly one candidate. Do not substitute a parent, subsidiary, affiliate, or similarly named entity.\nCompany: ${targetLead.companyName}\nWebsite: ${targetLead.website || 'Unknown'}\nCountry: ${targetLead.country || 'Unknown'}\nIndustry: ${targetLead.industry || 'Unknown'}\nHuman research question: ${targetLead.researchQuestion || 'No additional question'}` : ''
    const systemPrompt = `You are a cautious B2B market researcher following BridgeMakers Company Research Policy ${RESEARCH_POLICY_VERSION}. Never invent a company, fact, URL, citation, contact, business need, budget, or decision-maker. Separate verified facts from inferences and missing information. Use only public web information found in this request.\n\nReturn exactly one item for each of these ten categories: ${categoryKeys.join(', ')}. confirmed requires direct public evidence and at least one source URL. not_found means the relevant official channels were searched but no public evidence was found. needs_research means evidence is weak, conflicting, or incomplete. Identify the exact legal entity before scoring. Prefer first-party, registry, government/EU, event-organizer, official social, and official careers sources. Wikipedia and generic directories are discovery clues only. Every returned source URL must exactly match a URL cited by web search in this response.\n\nKeep proper names and source titles in their original language. Write all analysis, summaries, facts, inferences, missing information, next searches, and recommendations in natural Korean. Do not include personal contact details.`
    const userPrompt = `Find exactly one real company and research it deeply enough for human review.${targetInstruction}\n\nWorkspace: ${campaign.workspace}\nCampaign: ${campaign.name}\nHypothesis: ${campaign.hypothesis}\nTarget audience: ${campaign.targetAudience}\nOffer: ${campaign.offer || 'Not specified'}\nDo not return: ${(runInput.excludedCompanies || []).join(', ') || 'None'}\n\nInvestigate all ten categories. Scores are recommendations, not facts.`
    const response = await requestOpenAI(model, maxToolCalls, reasoningEffort, systemPrompt, userPrompt)
    const sourceMap = new Map<string, SearchSource>(); const textParts: string[] = []; let webSearchCalls = 0
    for (const item of response.output || []) {
      if (item.type === 'web_search_call') {
        webSearchCalls += 1
        for (const source of item.action?.sources || []) if (source.url) {
          sourceMap.set(normalizeUrl(source.url), { url: source.url, title: source.url, excerpt: null, pageAge: null })
        }
        if (item.action?.url) {
          sourceMap.set(normalizeUrl(item.action.url), { url: item.action.url, title: item.action.url, excerpt: null, pageAge: null })
        }
      }
      for (const content of item.content || []) {
        if (content.type === 'output_text' && content.text) textParts.push(content.text)
        for (const annotation of content.annotations || []) if (annotation.type === 'url_citation') {
          const citationUrl = annotation.url || annotation.url_citation?.url
          const citationTitle = annotation.title || annotation.url_citation?.title
          if (citationUrl) sourceMap.set(normalizeUrl(citationUrl), { url: citationUrl, title: citationTitle || citationUrl, excerpt: null, pageAge: null })
        }
      }
    }
    if (webSearchCalls > 0 && sourceMap.size === 0) {
      throw new Error('웹 검색은 실행됐지만 출처 목록을 수집하지 못했습니다. 후보를 탈락 처리하지 않고 실행 오류로 기록합니다.')
    }
    let rawOutput: unknown
    try { rawOutput = JSON.parse(textParts.join('')) } catch { throw new Error('AI 조사 결과가 완전한 JSON 형식으로 반환되지 않았습니다. 기존 결과는 변경하지 않았습니다.') }
    const parsed = ResearchOutputSchema.parse(rawOutput)
    let created = 0; let updated = 0; let skippedWithoutEvidence = 0; let skippedDuplicate = 0
    const rejectedCandidates: Array<{ companyName: string; reason: string; requestedSourceCount: number; matchedSourceCount: number }> = []
    const savedLeads: Array<{ id: string; companyName: string; campaignId: string; opportunityScore: number | null; fitScore: number | null; confidence: number | null; researchOverallStatus: string | null }> = []
    for (const candidate of parsed.candidates) {
      const requestedUrls = new Set([...candidate.sourceUrls, ...candidate.officialSourceUrls, ...candidate.researchItems.flatMap((item) => item.sourceUrls)].map(normalizeUrl))
      const matchedSources = Array.from(requestedUrls).map((url) => sourceMap.get(url)).filter((source): source is SearchSource => Boolean(source))
      if (matchedSources.length === 0) {
        skippedWithoutEvidence += 1
        rejectedCandidates.push({ companyName: candidate.companyName, reason: '응답 URL과 실제 검색 출처 URL 불일치', requestedSourceCount: requestedUrls.size, matchedSourceCount: 0 })
        continue
      }
      const matchedUrlSet = new Set(matchedSources.map((source) => normalizeUrl(source.url)))
      const officialSourceCount = new Set(candidate.officialSourceUrls.map(normalizeUrl).filter((url) => matchedUrlSet.has(url))).size
      const researchItems = candidate.researchItems.map((item) => ({ ...item, sourceUrls: item.sourceUrls.filter((url) => matchedUrlSet.has(normalizeUrl(url))), checkedAt: new Date().toISOString() }))
      const researchOverallStatus = deriveResearchOverallStatus({ items: researchItems, officialSourceCount })
      const confirmedFacts = researchItems.filter((item) => item.status === 'confirmed').flatMap((item) => item.facts)
      const inferences = researchItems.flatMap((item) => item.inferences); const missingInformation = researchItems.flatMap((item) => item.missingInformation)
      const existing = await prisma.growthLead.findFirst({ where: { campaignId: campaign.id, OR: [{ companyName: { equals: candidate.companyName, mode: 'insensitive' } }, ...(candidate.website ? [{ website: candidate.website }] : [])] } })
      const matchesTarget = !targetLead || existing?.id === targetLead.id || candidate.companyName.trim().toLowerCase() === targetLead.companyName.trim().toLowerCase()
      if (!matchesTarget) {
        skippedWithoutEvidence += 1
        rejectedCandidates.push({ companyName: candidate.companyName, reason: '재조사 대상 기업과 법인 동일성 불일치', requestedSourceCount: requestedUrls.size, matchedSourceCount: matchedSources.length })
        continue
      }
      if (existing && !targetLead) {
        skippedDuplicate += 1
        rejectedCandidates.push({ companyName: candidate.companyName, reason: '기존 기업과 중복', requestedSourceCount: requestedUrls.size, matchedSourceCount: matchedSources.length })
        continue
      }
      const lead = await prisma.$transaction(async (tx) => {
        const leadData = { campaignId: campaign.id, researchRunId: run.id, companyName: candidate.companyName, website: candidate.website, country: candidate.country, industry: candidate.industry,
          sourceUrl: matchedSources[0].url, evidence: confirmedFacts.join('\n') || '공식 근거가 충분하지 않아 추가 조사가 필요합니다.', facts: JSON.stringify(confirmedFacts), inferences: JSON.stringify(inferences),
          uncertainties: missingInformation.join('\n') || null, researchSummary: candidate.overallSummary, researchDetails: JSON.stringify({ policyVersion: RESEARCH_POLICY_VERSION, overallStatus: researchOverallStatus, officialSourceCount, recommendedApproach: candidate.recommendedApproach, items: researchItems }),
          researchOverallStatus, researchPolicyVersion: RESEARCH_POLICY_VERSION, opportunityScore: candidate.opportunityScore, fitScore: candidate.fitScore, actionabilityScore: candidate.actionabilityScore,
          confidence: candidate.confidence, sourceCount: matchedSources.length, sourceType: runInput.reviewMode ? 'ai_sol_review' : 'ai_research', stage: 'researched', reviewStatus: 'pending',
          nextAction: researchOverallStatus === 'review_ready' ? '사람이 핵심 근거와 영업 적합성을 검토합니다.' : candidate.recommendedApproach }
        const saved = targetLead ? await tx.growthLead.update({ where: { id: targetLead.id }, data: leadData }) : await tx.growthLead.create({ data: leadData })
        await tx.growthResearchSource.createMany({ data: matchedSources.map((source) => ({ runId: run.id, leadId: saved.id, url: source.url, title: source.title, excerpt: source.excerpt, pageAge: source.pageAge, contentHash: hash(`${source.url}\n${source.title}\n${source.excerpt || ''}`) })) })
        return saved
      })
      savedLeads.push(lead); if (targetLead) updated += 1; else created += 1
    }
    if (targetLead && updated === 0) throw new Error(`${targetLead.companyName} 재조사 결과에서 법인 동일성 또는 출처 근거를 확인하지 못했습니다. 기존 조사 결과는 변경하지 않았습니다.`)
    const approvals = runInput.reviewMode ? [] : (await Promise.all(savedLeads.map((lead) => createSolApproval(lead, runInput, campaign.workspace)))).filter(Boolean)
    const estimatedCostUsd = estimateCostUsd(model, response.usage, webSearchCalls)
    return prisma.automationRun.update({ where: { id: run.id }, data: { status: 'completed', finishedAt: new Date(),
      output: JSON.stringify({ provider: 'openai', model, searchSummary: parsed.searchSummary, candidatesReturned: parsed.candidates.length, candidatesCreated: created, candidatesUpdated: updated, targetLeadId: targetLead?.id || null, skippedWithoutEvidence, skippedDuplicate, rejectedCandidates, sourcesObserved: sourceMap.size, webSearchCalls, maxToolCalls, usage: response.usage, estimatedCostUsd, solApprovalsCreated: approvals.length }),
      nextAction: approvals.length ? `Sol 정밀 검증 승인 요청 ${approvals.length}건을 검토합니다.` : updated > 0 ? `${targetLead?.companyName} 재조사 결과를 사람이 검토합니다.` : created > 0 ? `기업 조사 후보 ${created}곳의 근거와 판단 지표를 검토합니다.` : skippedDuplicate > 0 ? `찾은 후보 ${skippedDuplicate}곳이 기존 목록과 중복되어 추가하지 않았습니다.` : skippedWithoutEvidence > 0 ? `후보 ${skippedWithoutEvidence}곳의 응답 URL이 실제 검색 출처와 일치하지 않아 저장하지 않았습니다.` : 'AI가 조사 후보를 반환하지 않았습니다. 조사 대상을 조정한 뒤 다시 실행합니다.',
    } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown research error'
    await prisma.automationRun.update({ where: { id: runId }, data: { status: 'failed', finishedAt: new Date(), error: message, nextAction: '오류 원인을 확인한 후 새 조사 실행을 시작합니다.' } })
    throw error
  }
}

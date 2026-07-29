import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const MODEL = process.env.OPENAI_RESEARCH_MODEL || 'gpt-5.6-luna'
const MAX_TOOL_CALLS = Number(process.env.OPENAI_DISCOVERY_MAX_TOOL_CALLS || 6)
const MAX_OUTPUT_TOKENS = Number(process.env.OPENAI_DISCOVERY_MAX_OUTPUT_TOKENS || 7000)

const ProspectSchema = z.object({
  companyName: z.string().min(1),
  website: z.string().url().nullable(),
  country: z.string().nullable(),
  city: z.string().nullable(),
  industry: z.string().nullable(),
  discoveryReason: z.string(),
  identityConfirmed: z.boolean(),
  officialWebsiteConfirmed: z.boolean(),
  recentSignal: z.boolean(),
  fitSignal: z.boolean(),
  screeningRationale: z.string(),
  sourceUrls: z.array(z.string().url()).min(1),
})
const OutputSchema = z.object({ searchSummary: z.string(), prospects: z.array(ProspectSchema).max(25) })

type ResponseOutput = {
  status?: string
  error?: { message?: string } | null
  incomplete_details?: { reason?: string } | null
  output?: Array<{
    type: string
    action?: { url?: string; sources?: Array<{ url?: string }> }
    content?: Array<{ type: string; text?: string; annotations?: Array<{ type: string; url?: string; title?: string; url_citation?: { url?: string; title?: string } }> }>
  }>
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number }
}

const schema = {
  type: 'object', additionalProperties: false, required: ['searchSummary', 'prospects'], properties: {
    searchSummary: { type: 'string' }, prospects: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['companyName', 'website', 'country', 'city', 'industry', 'discoveryReason', 'identityConfirmed', 'officialWebsiteConfirmed', 'recentSignal', 'fitSignal', 'screeningRationale', 'sourceUrls'],
      properties: {
        companyName: { type: 'string' }, website: { type: ['string', 'null'] }, country: { type: ['string', 'null'] }, city: { type: ['string', 'null'] }, industry: { type: ['string', 'null'] },
        discoveryReason: { type: 'string' }, identityConfirmed: { type: 'boolean' }, officialWebsiteConfirmed: { type: 'boolean' }, recentSignal: { type: 'boolean' }, fitSignal: { type: 'boolean' },
        screeningRationale: { type: 'string' }, sourceUrls: { type: 'array', items: { type: 'string' } },
      },
    } },
  },
} as const

function normalizeUrl(value: string) {
  try { const url = new URL(value); url.hash = ''; ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => url.searchParams.delete(key)); return url.toString().replace(/\/$/, '') }
  catch { return value.replace(/\/$/, '') }
}
function contentHash(value: string) { return crypto.createHash('sha256').update(value).digest('hex') }

export async function executeGrowthProspectDiscovery(runId: string) {
  const claimed = await prisma.automationRun.updateMany({ where: { id: runId, skillKey: 'growth-prospect-discovery', status: 'scheduled' }, data: { status: 'running', startedAt: new Date(), error: null } })
  if (claimed.count !== 1) { const existing = await prisma.automationRun.findUnique({ where: { id: runId } }); if (!existing) throw new Error('탐색 실행을 찾을 수 없습니다.'); return existing }
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.')
    const run = await prisma.automationRun.findUnique({ where: { id: runId }, include: { campaign: true } })
    if (!run?.campaign) throw new Error('탐색 캠페인을 찾을 수 없습니다.')
    const input = run.inputEvidence ? JSON.parse(run.inputEvidence) as { targetCount?: number; excludedCompanies?: string[]; sources?: string[] } : {}
    const targetCount = Math.min(25, Math.max(5, input.targetCount || 20))
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        instructions: `You discover B2B prospects for BridgeMakers. This is lightweight discovery and screening, not detailed company research. Find real companies from public first-party, government, chamber, association, KOTRA, official exhibitor, and official company sources. Never invent a company or URL. Do not collect personal contact details. Keep company names and proper nouns in their original language, but write discoveryReason and screeningRationale in natural Korean. Return each legal entity once. Every sourceUrls entry must be a URL used by web search in this response. Do not reject a company merely because public information is incomplete.`,
        input: `Find up to ${targetCount} company prospects for this campaign.\nWorkspace: ${run.campaign.workspace}\nCampaign: ${run.campaign.name}\nHypothesis: ${run.campaign.hypothesis}\nTarget audience: ${run.campaign.targetAudience}\nOffer: ${run.campaign.offer || 'Not specified'}\nPreferred discovery channels: official exhibitor lists, KOTRA or public export programs, chambers and associations, official company pages.\nAlready known companies to exclude: ${(input.excludedCompanies || []).join(', ') || 'None'}\n\nOnly perform basic screening: entity existence, official website, a recent public activity signal, and a plausible BridgeMakers fit signal. Do not perform the ten-category detailed research.`,
        tools: [{ type: 'web_search', search_context_size: 'high', user_location: { type: 'approximate', country: 'DE', timezone: 'Europe/Berlin' } }],
        include: ['web_search_call.action.sources'], max_tool_calls: MAX_TOOL_CALLS, reasoning: { effort: 'low' }, max_output_tokens: MAX_OUTPUT_TOKENS,
        text: { format: { type: 'json_schema', name: 'growth_prospect_discovery', strict: true, schema } }, store: false,
      }),
    })
    const result = await response.json() as ResponseOutput
    if (!response.ok) throw new Error(`OpenAI 후보 탐색 실패 (${response.status}): ${result.error?.message || '알 수 없는 오류'}`)
    if (result.status === 'incomplete') throw new Error(`후보 탐색 응답이 완료되지 않았습니다: ${result.incomplete_details?.reason || 'unknown'}`)
    const sourceMap = new Map<string, { url: string; title: string }>(); const textParts: string[] = []; let webSearchCalls = 0
    for (const item of result.output || []) {
      if (item.type === 'web_search_call') {
        webSearchCalls += 1
        for (const source of item.action?.sources || []) if (source.url) sourceMap.set(normalizeUrl(source.url), { url: source.url, title: source.url })
        if (item.action?.url) sourceMap.set(normalizeUrl(item.action.url), { url: item.action.url, title: item.action.url })
      }
      for (const content of item.content || []) {
        if (content.type === 'output_text' && content.text) textParts.push(content.text)
        for (const annotation of content.annotations || []) {
          const url = annotation.url || annotation.url_citation?.url; const title = annotation.title || annotation.url_citation?.title
          if (annotation.type === 'url_citation' && url) sourceMap.set(normalizeUrl(url), { url, title: title || url })
        }
      }
    }
    if (webSearchCalls > 0 && sourceMap.size === 0) throw new Error('웹 검색은 실행됐지만 출처 목록을 수집하지 못했습니다.')
    let raw: unknown
    try { raw = JSON.parse(textParts.join('')) } catch { throw new Error('후보 탐색 결과가 완전한 JSON으로 반환되지 않았습니다.') }
    const parsed = OutputSchema.parse(raw)
    let created = 0; let duplicates = 0; let unlinked = 0
    const statusCounts = { screening_passed: 0, review_needed: 0, held: 0 }
    for (const prospect of parsed.prospects) {
      const matched = prospect.sourceUrls.map((url) => sourceMap.get(normalizeUrl(url))).filter((source): source is { url: string; title: string } => Boolean(source))
      if (matched.length === 0) { unlinked += 1; continue }
      const duplicate = await prisma.growthLead.findFirst({ where: { campaignId: run.campaign.id, OR: [{ companyName: { equals: prospect.companyName, mode: 'insensitive' } }, ...(prospect.website ? [{ website: prospect.website }] : [])] } })
      if (duplicate) { duplicates += 1; continue }
      const reviewStatus = prospect.identityConfirmed && prospect.officialWebsiteConfirmed && prospect.recentSignal && prospect.fitSignal ? 'screening_passed' : prospect.identityConfirmed && prospect.officialWebsiteConfirmed ? 'review_needed' : 'held'
      const lead = await prisma.growthLead.create({ data: {
        campaignId: run.campaign.id, researchRunId: run.id, companyName: prospect.companyName, website: prospect.website, country: prospect.country, industry: prospect.industry,
        sourceUrl: matched[0].url, evidence: prospect.discoveryReason, researchSummary: null, uncertainties: reviewStatus === 'screening_passed' ? null : prospect.screeningRationale,
        sourceType: 'ai_discovery', reviewStatus, stage: 'discovered', sourceCount: matched.length,
        facts: JSON.stringify([prospect.discoveryReason]), inferences: JSON.stringify([prospect.screeningRationale]),
        nextAction: reviewStatus === 'screening_passed' ? '사람이 선택하면 Luna 정밀 조사로 이동합니다.' : reviewStatus === 'review_needed' ? '기본 조건을 사람이 검토합니다.' : '법인 또는 공식 사이트를 보완 확인합니다.',
      } })
      await prisma.growthResearchSource.createMany({ data: matched.map((source) => ({ runId: run.id, leadId: lead.id, url: source.url, title: source.title, contentHash: contentHash(`${source.url}\n${source.title}`) })) })
      statusCounts[reviewStatus] += 1; created += 1
    }
    const estimatedCostUsd = Number(((((result.usage?.input_tokens || 0) / 1_000_000) * 1) + (((result.usage?.output_tokens || 0) / 1_000_000) * 6) + (webSearchCalls * 0.01)).toFixed(6))
    return prisma.automationRun.update({ where: { id: run.id }, data: { status: 'completed', finishedAt: new Date(), output: JSON.stringify({ provider: 'openai', model: MODEL, searchSummary: parsed.searchSummary, prospectsReturned: parsed.prospects.length, prospectsCreated: created, duplicates, unlinked, statusCounts, sourcesObserved: sourceMap.size, webSearchCalls, usage: result.usage, estimatedCostUsd }), nextAction: created > 0 ? `후보 ${created}곳의 기본 확인 결과를 검토하고 정밀 조사 대상을 선택합니다.` : duplicates > 0 ? '찾은 후보가 모두 기존 후보와 중복됐습니다.' : '저장할 후보가 없습니다. 탐색 조건과 출처를 조정합니다.' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 후보 탐색 오류'
    await prisma.automationRun.update({ where: { id: runId }, data: { status: 'failed', finishedAt: new Date(), error: message, nextAction: '오류를 확인한 뒤 후보 탐색을 다시 시작합니다.' } })
    throw error
  }
}

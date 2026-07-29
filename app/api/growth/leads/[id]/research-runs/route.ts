import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { COMPANY_CONSTITUTION_VERSION } from '@/lib/company-policy'
import { prisma } from '@/lib/db'

const SKILL_KEY = 'growth-target-research'
const SKILL_VERSION = '0.4.1'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(request)
  const session = token ? await verifyToken(token) : null
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lead = await prisma.growthLead.findUnique({
    where: { id: params.id },
    include: { campaign: true, researchSources: { orderBy: { retrievedAt: 'desc' } } },
  })
  if (!lead) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const activeRun = await prisma.automationRun.findFirst({
    where: {
      campaignId: lead.campaignId,
      skillKey: SKILL_KEY,
      status: { in: ['scheduled', 'running'] },
      inputEvidence: { contains: `"targetLeadId":"${lead.id}"` },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (activeRun) return NextResponse.json({ error: '이 기업의 재조사가 이미 대기 또는 실행 중입니다.', data: activeRun }, { status: 409 })

  const previousSnapshot = {
    researchRunId: lead.researchRunId,
    researchSummary: lead.researchSummary,
    researchDetails: lead.researchDetails,
    researchOverallStatus: lead.researchOverallStatus,
    researchPolicyVersion: lead.researchPolicyVersion,
    opportunityScore: lead.opportunityScore,
    fitScore: lead.fitScore,
    actionabilityScore: lead.actionabilityScore,
    confidence: lead.confidence,
    facts: lead.facts,
    inferences: lead.inferences,
    uncertainties: lead.uncertainties,
    sources: lead.researchSources.map((source) => ({ url: source.url, title: source.title, retrievedAt: source.retrievedAt })),
  }
  const input = {
    requestedBy: session.actorName,
    provider: 'openai',
    model: process.env.OPENAI_RESEARCH_MODEL || 'gpt-5.6-luna',
    objective: `${lead.companyName}의 공개 정보를 현재 조사 정책으로 다시 확인`,
    targetLeadId: lead.id,
    targetLeadSnapshot: { companyName: lead.companyName, website: lead.website, country: lead.country, industry: lead.industry, researchQuestion: lead.researchQuestion },
    previousSnapshot,
    campaignSnapshot: { id: lead.campaign.id, workspace: lead.campaign.workspace, name: lead.campaign.name, hypothesis: lead.campaign.hypothesis, targetAudience: lead.campaign.targetAudience, offer: lead.campaign.offer },
    permissions: ['공개 웹 정보 조사', '해당 Growth 기업의 조사 초안 갱신', '새 출처와 실행 이력 추가'],
    prohibitedOutputs: ['외부 메시지 발송', '개인 연락처 수집', '과거 실행 및 출처 기록 삭제', '다른 법인으로 대체'],
    failureBehavior: '조사 또는 검증 실패 시 기존 기업 조사 결과를 변경하지 않고 실행을 실패로 기록',
    idempotencyStrategy: '동일 기업의 scheduled/running 실행은 하나만 허용하고 각 실행은 고유 triggerKey 사용',
  }

  const run = await prisma.automationRun.create({
    data: {
      skillKey: SKILL_KEY,
      skillVersion: SKILL_VERSION,
      workspace: lead.campaign.workspace,
      campaignId: lead.campaignId,
      triggerType: 'manual',
      triggerKey: `${SKILL_KEY}:lead:${lead.id}:${crypto.randomUUID()}`,
      status: 'scheduled',
      scheduledFor: new Date(),
      inputEvidence: JSON.stringify(input),
      nextAction: `${lead.companyName}의 10개 조사 항목을 공개 출처로 다시 확인합니다.`,
      constitutionVersion: COMPANY_CONSTITUTION_VERSION,
    },
  })
  return NextResponse.json({ success: true, data: run }, { status: 201 })
}

import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { COMPANY_CONSTITUTION_VERSION } from '@/lib/company-policy'
import { prisma } from '@/lib/db'

const SKILL_KEY = 'growth-target-research'
const SKILL_VERSION = '0.4.1'

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request)
  const session = token ? await verifyToken(token) : null
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const campaign = await prisma.growthCampaign.findUnique({ where: { id: body.campaignId } })
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  const activeRun = await prisma.automationRun.findFirst({
    where: { campaignId: campaign.id, skillKey: SKILL_KEY, status: { in: ['scheduled', 'running'] } },
    orderBy: { createdAt: 'desc' },
  })
  if (activeRun) {
    return NextResponse.json({ error: '이 캠페인의 AI 조사가 이미 대기 또는 실행 중입니다.', data: activeRun }, { status: 409 })
  }

  const requestedAt = new Date()
  const batchIndex = Number.isInteger(body.batchIndex) ? Math.max(1, body.batchIndex) : 1
  const batchTotal = Number.isInteger(body.batchTotal) ? Math.min(5, Math.max(1, body.batchTotal)) : 1
  const existingCompanies = await prisma.growthLead.findMany({ where: { campaignId: campaign.id }, select: { companyName: true } })
  const input = {
    requestedBy: session.actorName,
    objective: '캠페인 가설에 맞는 검토 대상 기업 후보를 근거와 함께 발굴',
    campaignSnapshot: {
      id: campaign.id,
      workspace: campaign.workspace,
      name: campaign.name,
      hypothesis: campaign.hypothesis,
      targetAudience: campaign.targetAudience,
      offer: campaign.offer,
    },
    batchId: typeof body.batchId === 'string' ? body.batchId : crypto.randomUUID(),
    batchIndex,
    batchTotal,
    excludedCompanies: existingCompanies.map((lead) => lead.companyName),
    provider: 'openai',
    model: process.env.OPENAI_RESEARCH_MODEL || 'gpt-5.6-luna',
    permissions: ['OpenAI Luna 웹 검색으로 공개 정보 읽기', 'Growth 조사 후보 초안 생성', '검색 출처, 도구 호출 수, 토큰 사용량과 추정 비용 기록'],
    prohibitedOutputs: ['근거 없는 기업 생성', '외부 메시지 발송', '고객 정보 외부 전송'],
    sources: [],
    limitations: ['공개 웹 정보만 조사하며 개인 연락처와 기존 고객·재무 정보는 외부 서비스에 전달하지 않습니다.'],
  }
  const run = await prisma.automationRun.create({
    data: {
      skillKey: SKILL_KEY,
      skillVersion: SKILL_VERSION,
      workspace: campaign.workspace,
      campaignId: campaign.id,
      triggerType: 'manual',
      triggerKey: `${SKILL_KEY}:${campaign.id}:${crypto.randomUUID()}`,
      status: 'scheduled',
      scheduledFor: requestedAt,
      inputEvidence: JSON.stringify(input),
      nextAction: '조사 워커가 공개 웹 소스를 검색하고 출처가 있는 후보 초안을 생성합니다.',
      constitutionVersion: COMPANY_CONSTITUTION_VERSION,
    },
  })
  return NextResponse.json({ success: true, data: run }, { status: 201 })
}

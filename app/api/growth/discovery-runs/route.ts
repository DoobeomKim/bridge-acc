import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { COMPANY_CONSTITUTION_VERSION } from '@/lib/company-policy'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request); const session = token ? await verifyToken(token) : null
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json(); const campaign = await prisma.growthCampaign.findUnique({ where: { id: body.campaignId } })
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  const active = await prisma.automationRun.findFirst({ where: { campaignId: campaign.id, skillKey: 'growth-prospect-discovery', status: { in: ['scheduled', 'running'] } } })
  if (active) return NextResponse.json({ error: '이 캠페인의 후보 탐색이 이미 진행 중입니다.', data: active }, { status: 409 })
  const known = await prisma.growthLead.findMany({ where: { campaignId: campaign.id }, select: { companyName: true } })
  const run = await prisma.automationRun.create({ data: {
    skillKey: 'growth-prospect-discovery', skillVersion: '0.1.0', workspace: campaign.workspace, campaignId: campaign.id, triggerType: 'manual',
    triggerKey: `growth-prospect-discovery:${campaign.id}:${crypto.randomUUID()}`, status: 'scheduled', scheduledFor: new Date(), constitutionVersion: COMPANY_CONSTITUTION_VERSION,
    inputEvidence: JSON.stringify({ requestedBy: session.actorName, objective: '후보 기업을 넓게 발굴하고 기본 조건만 확인', targetCount: Math.min(25, Math.max(5, Number(body.targetCount) || 20)), excludedCompanies: known.map((item) => item.companyName), trigger: '사람이 기업 탐색 시작 버튼을 누름', inputs: ['campaign snapshot', 'public web sources'], outputs: ['candidate companies', 'basic screening status', 'source records'], permissions: ['공개 웹 검색', '후보 기업과 출처 생성'], approvalGates: ['정밀 조사는 사람 선택 후 실행', 'Sol은 별도 사람 승인'], failureBehavior: '부분 추정을 저장하지 않고 실패 실행 기록 보존', idempotency: '캠페인당 scheduled/running 탐색 1건, 기업명·웹사이트 중복 방지' }),
    nextAction: '공식 목록과 공개 웹에서 후보를 발굴하고 기본 조건을 확인합니다.',
  } })
  return NextResponse.json({ success: true, data: run }, { status: 201 })
}

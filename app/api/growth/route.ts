import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { COMPANY_CONSTITUTION_VERSION } from '@/lib/company-policy'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { hashActionPayload, OutreachPayload } from '@/lib/growth-actions'

async function actor(request: NextRequest) {
  const token = getTokenFromRequest(request)
  return token ? verifyToken(token) : null
}

export async function GET(request: NextRequest) {
  const workspace = request.nextUrl.searchParams.get('workspace') || 'bridge'
  if (!['bridge', 'fairtale'].includes(workspace)) {
    return NextResponse.json({ error: 'Invalid workspace' }, { status: 400 })
  }
  const campaigns = await prisma.growthCampaign.findMany({
    where: { workspace },
    include: {
      researchRuns: {
        where: { skillKey: { in: ['growth-prospect-discovery', 'growth-target-research'] } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      leads: {
        include: {
          customer: { select: { id: true, customerNumber: true, name: true, company: true, email: true, phone: true } },
          researchSources: { orderBy: { retrievedAt: 'desc' } },
          outreachDrafts: { include: { approvalRequest: true }, orderBy: { createdAt: 'desc' } },
        },
        orderBy: [{ fitScore: 'desc' }, { createdAt: 'desc' }],
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ success: true, data: campaigns })
}

export async function POST(request: NextRequest) {
  const session = await actor(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()

  if (body.type === 'campaign') {
    if (!['bridge', 'fairtale'].includes(body.workspace) || !body.name || !body.hypothesis || !body.targetAudience) {
      return NextResponse.json({ error: 'Required campaign fields are missing' }, { status: 400 })
    }
    const campaign = await prisma.growthCampaign.create({
      data: {
        workspace: body.workspace,
        name: body.name.trim(),
        hypothesis: body.hypothesis.trim(),
        targetAudience: body.targetAudience.trim(),
        offer: body.offer?.trim() || null,
        status: 'active',
        successCriteria: JSON.stringify(body.successCriteria || { researched: 20, qualified: 10, contacted: 5, meetings: 2, contracts: 1 }),
        startsAt: new Date(),
        createdBy: session.actorName,
      },
    })
    return NextResponse.json({ success: true, data: campaign }, { status: 201 })
  }

  if (body.type === 'lead') {
    const campaign = await prisma.growthCampaign.findUnique({ where: { id: body.campaignId } })
    if (!campaign || !body.companyName) return NextResponse.json({ error: 'Campaign and company name are required' }, { status: 400 })
    const lead = await prisma.growthLead.create({
      data: {
        campaignId: campaign.id,
        companyName: body.companyName.trim(),
        website: body.website?.trim() || null,
        country: body.country?.trim() || null,
        industry: body.industry?.trim() || null,
        sourceUrl: body.sourceUrl?.trim() || null,
        evidence: body.evidence?.trim() || null,
        researchSummary: body.researchSummary?.trim() || null,
        uncertainties: body.uncertainties?.trim() || null,
        researchPurpose: body.researchPurpose?.trim() || null,
        researchQuestion: body.researchQuestion?.trim() || null,
        priority: ['low', 'normal', 'high'].includes(body.priority) ? body.priority : 'normal',
        sourceType: 'manual',
        fitScore: typeof body.fitScore === 'number' ? Math.max(0, Math.min(100, Math.round(body.fitScore))) : null,
        nextAction: '사람이 적합도를 검토합니다.',
      },
    })
    return NextResponse.json({ success: true, data: lead }, { status: 201 })
  }

  if (body.type === 'customer_lead') {
    const [campaign, customer] = await Promise.all([
      prisma.growthCampaign.findUnique({ where: { id: body.campaignId } }),
      prisma.customer.findUnique({ where: { id: body.customerId } }),
    ])
    if (!campaign || !customer) {
      return NextResponse.json({ error: 'Campaign and customer are required' }, { status: 400 })
    }
    const existing = await prisma.growthLead.findFirst({
      where: { campaignId: campaign.id, customerId: customer.id },
    })
    if (existing) {
      return NextResponse.json({ error: '이 클라이언트는 이미 현재 캠페인의 조사 후보입니다.' }, { status: 409 })
    }
    const companyName = customer.company?.trim() || customer.name.trim()
    const lead = await prisma.growthLead.create({
      data: {
        campaignId: campaign.id,
        customerId: customer.id,
        companyName,
        country: customer.country,
        contactName: customer.name,
        contactChannel: customer.email || customer.phone,
        evidence: `기존 클라이언트 원본 ${customer.customerNumber}에서 연결됨`,
        researchPurpose: body.researchPurpose?.trim() || null,
        researchQuestion: body.researchQuestion?.trim() || null,
        priority: ['low', 'normal', 'high'].includes(body.priority) ? body.priority : 'normal',
        sourceType: 'customer',
        nextAction: '기존 거래 관계와 조사 목적을 바탕으로 적합성을 검토합니다.',
      },
    })
    return NextResponse.json({ success: true, data: lead }, { status: 201 })
  }

  if (body.type === 'outreach_draft') {
    const lead = await prisma.growthLead.findUnique({ include: { campaign: true }, where: { id: body.leadId } })
    if (!lead || !body.body || !body.channel) return NextResponse.json({ error: 'Lead, channel and body are required' }, { status: 400 })
    if (lead.reviewStatus !== 'qualified') return NextResponse.json({ error: 'Only qualified leads can receive outreach drafts' }, { status: 409 })

    const basePayload = {
      leadId: lead.id,
      channel: body.channel,
      language: body.language || 'de',
      subject: body.subject?.trim() || null,
      body: body.body.trim(),
    }
    const result = await prisma.$transaction(async (tx) => {
      const draft = await tx.growthOutreachDraft.create({
        data: {
          ...basePayload,
          rationale: body.rationale?.trim() || null,
          evidence: lead.evidence,
          payloadHash: 'pending',
          status: 'waiting_approval',
        },
      })
      const payload: OutreachPayload = { draftId: draft.id, ...basePayload }
      const payloadHash = hashActionPayload(payload)
      const approval = await tx.approvalRequest.create({
        data: {
          title: `${lead.companyName} 접근 메시지 최종안 확정`,
          summary: `${body.channel} 채널용 메시지를 사람이 검토한 최종안으로 확정합니다. 이번 단계에서는 자동 발송하지 않습니다.`,
          actionType: 'outreach_message_finalize',
          workspace: lead.campaign.workspace,
          riskLevel: 'high',
          evidence: lead.evidence,
          proposedPayload: JSON.stringify(payload),
          requestedBy: 'growth-outreach-draft',
          constitutionVersion: COMPANY_CONSTITUTION_VERSION,
        },
      })
      const updatedDraft = await tx.growthOutreachDraft.update({
        where: { id: draft.id },
        data: { payloadHash, approvalRequestId: approval.id },
      })
      return { draft: updatedDraft, approval }
    })
    return NextResponse.json({ success: true, data: result }, { status: 201 })
  }

  return NextResponse.json({ error: 'Unknown operation' }, { status: 400 })
}

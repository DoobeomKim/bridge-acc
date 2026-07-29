import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

const reviewTransitions: Record<string, { reviewStatus: string; stage: string; nextAction: string }> = {
  qualified: { reviewStatus: 'qualified', stage: 'qualified', nextAction: '접근 담당자와 메시지 초안을 준비합니다.' },
  rejected: { reviewStatus: 'rejected', stage: 'lost', nextAction: '제외 이유를 학습 자료로 기록합니다.' },
  info_needed: { reviewStatus: 'info_needed', stage: 'discovered', nextAction: '부족한 공개 정보를 추가 조사합니다.' },
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const token = getTokenFromRequest(request)
  const session = token ? await verifyToken(token) : null
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()

  if (body.reviewStatus) {
    const transition = reviewTransitions[body.reviewStatus]
    if (!transition) return NextResponse.json({ error: 'Invalid review status' }, { status: 400 })
    const lead = await prisma.growthLead.update({
      where: { id: params.id },
      data: { ...transition, reviewedBy: session.actorName, reviewedAt: new Date() },
    })
    return NextResponse.json({ success: true, data: lead })
  }

  const allowedStages = ['qualified', 'contact_ready', 'contacted', 'replied', 'meeting', 'proposal', 'negotiation', 'won', 'lost']
  if (body.stage && allowedStages.includes(body.stage)) {
    const lead = await prisma.growthLead.update({
      where: { id: params.id },
      data: { stage: body.stage, nextAction: body.nextAction?.trim() || null },
    })
    return NextResponse.json({ success: true, data: lead })
  }
  return NextResponse.json({ error: 'No valid update supplied' }, { status: 400 })
}


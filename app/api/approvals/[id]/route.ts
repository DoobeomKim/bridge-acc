import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { TOP_LEVEL_APPROVERS } from '@/lib/company-policy'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { executeApprovedInternalAction, reflectNonApprovalDecision } from '@/lib/growth-actions'
import { executeGrowthTargetResearch } from '@/lib/growth-target-research'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()
  const status = body.status as string
  const token = getTokenFromRequest(request)
  const session = token ? await verifyToken(token) : null
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const actorKey = session.actorKey
  if (!['approved', 'rejected', 'changes_requested', 'deferred'].includes(status)) {
    return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
  }
  const actor = TOP_LEVEL_APPROVERS.find((item) => item.key === actorKey)
  if (!actor) return NextResponse.json({ error: 'Unknown approver' }, { status: 403 })

  const approval = await prisma.$transaction(async (tx) => {
    const current = await tx.approvalRequest.findUnique({ where: { id: params.id } })
    if (!current || current.status !== 'pending') throw new Error('Approval is no longer pending')
    if (status === 'approved') await executeApprovedInternalAction(tx, current)
    else await reflectNonApprovalDecision(tx, current, status)
    const updated = await tx.approvalRequest.update({
      where: { id: params.id },
      data: { status, decidedBy: actor.name, decisionNote: body.note || null, decidedAt: new Date() },
    })
    const runStatus = status === 'approved' ? 'approved' : status === 'rejected' ? 'cancelled' : 'waiting_approval'
    await tx.automationRun.updateMany({ where: { approvalRequestId: params.id }, data: { status: runStatus } })
    return updated
  })
  if (status === 'approved' && approval.actionType === 'growth_sol_research') {
    const run = await prisma.automationRun.findUnique({ where: { approvalRequestId: approval.id } })
    if (!run) return NextResponse.json({ error: 'Approved Sol research run not found' }, { status: 500 })
    await prisma.automationRun.update({ where: { id: run.id }, data: { status: 'scheduled', scheduledFor: new Date() } })
    try {
      const executed = await executeGrowthTargetResearch(run.id)
      return NextResponse.json({ success: true, data: approval, execution: executed })
    } catch {
      const failed = await prisma.automationRun.findUnique({ where: { id: run.id } })
      return NextResponse.json({ success: true, data: approval, execution: failed, warning: '승인은 완료됐지만 Sol 검증 실행은 실패했습니다. 실행 기록에서 오류를 확인하세요.' })
    }
  }
  return NextResponse.json({ success: true, data: approval })
}

import crypto from 'crypto'
import type { ApprovalRequest, Prisma } from '@prisma/client'
import { getActionDefinition } from '@/lib/action-registry'

export type OutreachPayload = {
  draftId: string
  leadId: string
  channel: string
  language: string
  subject: string | null
  body: string
}

export function hashActionPayload(payload: unknown) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

export async function executeApprovedInternalAction(
  tx: Prisma.TransactionClient,
  approval: ApprovalRequest,
) {
  if (approval.actionType === 'strategy_priority_set') return
  if (approval.actionType === 'growth_sol_research') {
    if (!approval.proposedPayload) throw new Error('Approval payload is missing')
    const payload = JSON.parse(approval.proposedPayload) as { leadId?: string; campaignId?: string; requestedModel?: string }
    if (!payload.leadId || !payload.campaignId || !payload.requestedModel) throw new Error('Sol review approval payload is invalid')
    const lead = await tx.growthLead.findFirst({ where: { id: payload.leadId, campaignId: payload.campaignId } })
    if (!lead) throw new Error('Sol review target company not found')
    return
  }
  const definition = getActionDefinition(approval.actionType)
  if (!definition || approval.actionType !== 'outreach_message_finalize') {
    throw new Error(`No executor registered for ${approval.actionType}`)
  }
  if (definition.externalEffect) throw new Error('External actions are not enabled in Growth phase 1')
  if (!approval.proposedPayload) throw new Error('Approval payload is missing')

  const payload = JSON.parse(approval.proposedPayload) as OutreachPayload
  const draft = await tx.growthOutreachDraft.findUnique({ where: { id: payload.draftId } })
  if (!draft || draft.leadId !== payload.leadId) throw new Error('Outreach draft not found')
  if (draft.payloadHash !== hashActionPayload(payload)) {
    throw new Error('Draft changed after approval request. A new approval is required.')
  }

  await tx.growthOutreachDraft.update({
    where: { id: draft.id },
    data: { status: 'approved', approvedAt: new Date() },
  })
}

export async function reflectNonApprovalDecision(
  tx: Prisma.TransactionClient,
  approval: ApprovalRequest,
  status: string,
) {
  if (approval.actionType !== 'outreach_message_finalize') return
  await tx.growthOutreachDraft.updateMany({
    where: { approvalRequestId: approval.id },
    data: { status: status === 'changes_requested' ? 'changes_requested' : status },
  })
}

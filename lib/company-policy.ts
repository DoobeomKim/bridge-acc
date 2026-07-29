export const COMPANY_CONSTITUTION_VERSION = '1.0.0' as const

export type ActionMode = 'automatic' | 'human_approval_required' | 'prohibited'

export const TOP_LEVEL_APPROVERS = [
  { key: 'doobeom-kim', name: 'Doobeom Kim', role: 'Director / Majority Shareholder' },
  { key: 'eu-ra-jung', name: 'Eu Ra Jung', role: 'Managing Director' },
] as const

const actionPolicy: Record<string, ActionMode> = {
  internal_research: 'automatic',
  internal_summary: 'automatic',
  internal_draft: 'automatic',
  missing_information_check: 'automatic',
  internal_briefing_create: 'automatic',
  internal_quest_create: 'automatic',
  outreach_message_finalize: 'human_approval_required',
  payment_create: 'human_approval_required',
  purchase_create: 'human_approval_required',
  contract_commit: 'human_approval_required',
  final_price_set: 'human_approval_required',
  customer_message_send: 'human_approval_required',
  public_publish: 'human_approval_required',
  external_sensitive_data_send: 'human_approval_required',
  company_record_delete: 'human_approval_required',
  automation_activate: 'human_approval_required',
  policy_change: 'human_approval_required',
  personnel_final_decision: 'prohibited',
  constitution_auto_change: 'prohibited',
  approval_bypass: 'prohibited',
  evidence_fabrication: 'prohibited',
}

export function getActionMode(action: string): ActionMode {
  return actionPolicy[action] ?? 'human_approval_required'
}

export function requiresHumanApproval(action: string) {
  return getActionMode(action) === 'human_approval_required'
}

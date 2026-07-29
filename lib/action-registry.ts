import type { ActionMode } from '@/lib/company-policy'

export type ActionDefinition = {
  actionType: string
  version: string
  mode: ActionMode
  trigger: string
  inputs: string[]
  outputs: string[]
  permissions: string[]
  approvalGate: string
  failureBehavior: string
  idempotency: string
  externalEffect: boolean
}

const ACTION_REGISTRY: Record<string, ActionDefinition> = {
  growth_prospect_discovery: {
    actionType: 'growth_prospect_discovery',
    version: '0.1.0',
    mode: 'automatic',
    trigger: 'A signed-in human clicks Start company discovery for a campaign.',
    inputs: ['campaignId', 'workspace', 'hypothesis', 'targetAudience', 'offer', 'targetCount'],
    outputs: ['Candidate companies', 'Basic screening states', 'Immutable source records', 'AutomationRun audit record'],
    permissions: ['Read the campaign', 'Search public web information through OpenAI Luna', 'Create internal candidate records and sources'],
    approvalGate: 'No approval for internal public-web discovery; humans select companies before detailed research.',
    failureBehavior: 'Record the run as failed and do not promote incomplete output to detailed research.',
    idempotency: 'One active discovery run per campaign; company name and website are checked for duplicates.',
    externalEffect: true,
  },
  growth_target_research_queue: {
    actionType: 'growth_target_research_queue',
    version: '0.4.1',
    mode: 'automatic',
    trigger: 'A signed-in human explicitly clicks AI target research for a campaign.',
    inputs: ['campaignId', 'workspace', 'hypothesis', 'targetAudience', 'offer'],
    outputs: ['An immutable scheduled AutomationRun with a campaign input snapshot'],
    permissions: ['Read the selected campaign', 'Search public web information through OpenAI Luna', 'Create draft leads and immutable source records'],
    approvalGate: 'No approval for a one-off internal queue record; recurring activation still requires human approval.',
    failureBehavior: 'Return an error without creating a partial run; later worker failures must be written to the run.',
    idempotency: 'Only one scheduled or running target-research run is allowed per campaign.',
    externalEffect: true,
  },
  growth_sol_research: {
    actionType: 'growth_sol_research',
    version: '0.4.1',
    mode: 'human_approval_required',
    trigger: 'Luna research finds a high-value company whose confidence or research completeness is insufficient.',
    inputs: ['leadId', 'campaignId', 'requestedModel', 'maxToolCalls', 'reason'],
    outputs: ['A scheduled Sol re-verification run after approval', 'Updated research with preserved prior evidence'],
    permissions: ['Read the selected company and campaign', 'Search public web information through OpenAI Sol', 'Append sources and update the current research draft'],
    approvalGate: 'Doobeom Kim or Eu Ra Jung must approve before any Sol API request is made.',
    failureBehavior: 'Record failure on the approved run and preserve the prior company research unchanged.',
    idempotency: 'Only one pending Sol approval is created for the same lead; an approved run can be claimed once.',
    externalEffect: true,
  },
  outreach_message_finalize: {
    actionType: 'outreach_message_finalize',
    version: '1.0.0',
    mode: 'human_approval_required',
    trigger: 'A user creates an outreach draft for a qualified lead.',
    inputs: ['draftId', 'leadId', 'channel', 'language', 'subject', 'body'],
    outputs: ['An internally approved, immutable outreach draft'],
    permissions: ['Read the linked growth lead', 'Update the linked outreach draft'],
    approvalGate: 'Doobeom Kim or Eu Ra Jung must approve the exact hashed payload.',
    failureBehavior: 'Rollback the decision transaction and leave the request pending.',
    idempotency: 'The draft-to-approval relation is unique and approval decisions only run from pending state.',
    externalEffect: false,
  },
}

export function getActionDefinition(actionType: string) {
  return ACTION_REGISTRY[actionType] ?? null
}

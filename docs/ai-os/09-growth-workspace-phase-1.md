# Growth Workspace — Phase 1

Status: Implemented locally  
Constitution: `BRIDGE_CONSTITUTION.md` version 1.0.0

## Purpose

Growth turns a market hypothesis into an evidence-backed sequence: campaign, research candidates, human qualification, pipeline, outreach draft, and approval. BridgeMakers Services and Fair Tale use separate workspaces while sharing the same workflow and approval policy.

## Current boundary

- The system stores hypotheses, evidence, uncertainties, lead review decisions, and pipeline stages separately.
- Research candidates can be entered and reviewed. Automated web research is not activated in phase 1.
- Only a human-qualified lead can receive an outreach draft.
- Approval finalizes the exact internal draft. It does not send email, publish content, contact a customer, purchase anything, or call an external service.
- A changed payload requires a new approval because the approved payload hash must match the stored draft.

## Executable action contract

### `outreach_message_finalize` version 1.0.0

| Contract field | Declaration |
| --- | --- |
| Trigger | A signed-in user creates an outreach draft for a qualified lead. |
| Inputs | Draft ID, lead ID, channel, language, subject, and body. |
| Outputs | The linked internal draft changes from `waiting_approval` to `approved`. |
| Permissions | Read the linked lead and update only the linked draft. |
| Approval gate | Doobeom Kim or Eu Ra Jung approves the exact hashed payload. |
| Failure behavior | The database transaction rolls back; the request remains pending and no partial decision is recorded. |
| Idempotency | One approval is uniquely linked to one draft; only a pending request may execute. |
| External effect | None. Sending remains unavailable in phase 1. |

## Next phase

Automated research and external outreach should be introduced as separate actions. Each must get its own permission declaration, evidence capture, failure behavior, idempotency strategy, and approval boundary before activation.


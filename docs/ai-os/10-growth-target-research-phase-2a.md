# Growth Target Research — Phase 2A

Status: Implemented locally  
Skill: `growth-target-research` version 0.3.1

## Current capability

The Growth workspace can create and execute a target-research run for a selected campaign. The worker uses Anthropic web search, preserves the exact campaign snapshot and usage, validates candidate source URLs against search results from the same request, and creates only evidence-backed draft leads.

Official names, URLs, and source titles remain in their original language. Analysis fields—verified facts, inferences, uncertainties, recommended approach, and search summary—are generated in Korean.

Version 0.2.3 raises the structured-output allowance and detects token-limit truncation before JSON parsing. Incomplete JSON is rejected without creating partial leads.

Version 0.3.1 researches up to three companies deeply per campaign run or exactly one existing company in re-research mode. It returns all ten Research Policy 1.0.0 categories with per-item completion states, preserves item evidence and the previous lead snapshot in the run audit record, and records opportunity, fit, actionability, and evidence-confidence scores separately.

## Execution contract

| Contract field | Declaration |
| --- | --- |
| Trigger | A signed-in human clicks `AI 타깃 조사 시작`. |
| Inputs | Campaign ID, workspace, hypothesis, target audience, and offer. |
| Outputs | An `AutomationRun`, evidence-backed draft leads, and immutable source records. |
| Permissions | Read the selected campaign, search public web information through Anthropic, and write internal drafts and sources. |
| Approval gate | A one-off internal queue record is automatic. Activating a recurring automation or adding new external permissions requires human approval. |
| Failure behavior | Set the run to `failed`, record `finishedAt` and `error`, and never promote a candidate into the pipeline. |
| Idempotency | A campaign cannot have more than one `scheduled` or `running` target-research run. |
| External effect | Public campaign criteria are sent to Anthropic for web search. No customer record, financial data, message, publication, or purchase is transmitted. |

## Worker handoff

Runs move through `scheduled → running → completed|failed`. Human review remains mandatory before any lead enters the pipeline. Recurring activation remains a separate approval-gated change.

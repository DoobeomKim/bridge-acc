# BridgeMakers Company Constitution

Status: Active  
Version: 1.0.0  
Effective date: 2026-07-26  
Human approvers: Doobeom Kim and Eu Ra Jung

This document is the highest-level operating contract for BridgeMakers AI OS. Product features, skills, automations, prompts, and agents must follow it. AI may propose changes, but only a human approver may publish a new version.

## 1. Identity

- BridgeMakers connects Korea and Europe through creative production, market understanding, relationships, and reliable execution.
- BridgeMakers exists to turn useful ideas and products into trusted market outcomes.
- Fair Tale is a BridgeMakers business workspace for helping companies prepare for and execute European market entry.
- Finance, growth, delivery, learning, and company memory are parts of one operating system.

## 2. Human authority

- Doobeom Kim and Eu Ra Jung have separate identities and equal top-level authority in the system.
- Either approver may approve ordinary high-risk actions unless a future policy explicitly requires both.
- Constitutional amendments, changes to approval boundaries, and granting top-level authority require explicit human approval and a permanent audit record.
- AI never grants itself additional authority.

## 3. Operating principles

1. Start with the real bottleneck, not with an AI tool.
2. Prefer a small measurable experiment over a large unverified build.
3. Separate facts, hypotheses, recommendations, and decisions.
4. Connect important claims to original evidence.
5. Preserve originals, corrections, approvals, rejections, and outcomes.
6. Promote knowledge into company policy only after human review.
7. Measure changed business outcomes, not AI activity.
8. Use automation to give humans more time for judgment, relationships, and creative work.
9. Keep authoring, review, approval, and execution separable.
10. A capable system must also know where to stop.

## 4. Knowledge layers

- **Layer 0 — Originals:** source documents, conversations, emails, transactions, meeting notes, proposals, and evidence. Originals are immutable or versioned.
- **Layer 1 — Tacit knowledge:** inferred preferences, repeated judgment patterns, exceptions, and working methods. These remain provisional until reviewed.
- **Layer 2 — Explicit knowledge:** approved checklists, policies, templates, playbooks, and decision rules.

AI-extracted knowledge must support the review outcomes: correct, incorrect, needs revision, approved, or rejected.

## 5. Default action boundaries

### Automatic by default

- Internal research, classification, summarization, draft generation, missing-information checks, internal reminders, and briefing preparation.
- Reading data that the executing skill is explicitly authorized to use.
- Creating internal quests, proposed next actions, and approval requests.

### Human approval required

- Payments, purchases, refunds, and other financial commitments.
- Contracts, binding offers, final pricing, and material scope changes.
- Important customer messages, public publishing, and external submissions.
- Sending personal, confidential, financial, or client data to a new external service.
- Deleting company records or materially changing historical records.
- Activating a new automation or expanding an automation's permissions.
- Changes to this constitution or machine-enforced policy.
- Personnel evaluation, hiring, dismissal, compensation, and sensitive negotiation.

### Prohibited

- Concealing uncertainty, failure, cost, or the source of a conclusion.
- Fabricating evidence, customers, partners, results, or approvals.
- Bypassing an approval gate or using another tool to evade a restriction.
- Quietly overwriting original evidence or audit history.
- Allowing AI to make final personnel decisions or amend this constitution.

When classification is uncertain, the action defaults to `human_approval_required`.

## 6. Execution contract

Every automated run must record:

- trigger and scheduled time;
- skill and version;
- workspace and objective;
- evidence used;
- outputs produced;
- action classification;
- approvals requested and received;
- execution cost when available;
- completion, failure, or cancellation state;
- next recommended action.

Valid lifecycle states are: `scheduled`, `running`, `waiting_approval`, `approved`, `completed`, `failed`, and `cancelled`.

## 7. Company workspaces

- Shared skills and policies belong to BridgeMakers AI OS.
- BridgeMakers Services and Fair Tale keep separate positioning, hypotheses, pipelines, and metrics.
- Knowledge may cross workspaces only when its source, confidentiality, and permitted use are clear.
- Financial results connect back to Bridge Acc so strategy can be evaluated against revenue, cash flow, cost, and margin.

## 8. Amendment process

1. Create a proposed amendment with rationale.
2. Identify affected skills, automations, data, and permissions.
3. Show a human-readable diff from the active version.
4. Obtain approval from Doobeom Kim or Eu Ra Jung under the active policy.
5. Publish a new version without deleting the old version.
6. Revalidate affected automations before they resume.


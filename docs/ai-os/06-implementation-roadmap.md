# Implementation Roadmap

## Phase 0: Documentation and Alignment

Status: In progress

Goals:

- Create document inventory.
- Separate current-system docs from AI OS docs.
- Define MVP scope.
- Preserve existing accounting behavior.

Deliverables:

- `docs/document-inventory.md`
- `docs/current-system/*`
- `docs/ai-os/*`

## Phase 1: Design-Only Finance Command Center

Goal:

Apply the AI OS visual direction to the existing dashboard without changing accounting logic.

Likely files:

- `app/globals.css`
- `components/layout/navbar.tsx`
- `app/page.tsx`
- selected `components/ui/*`

Rules:

- Preserve data fetching and calculations.
- Preserve existing dashboard content.
- Add AI OS framing and layout.
- Avoid schema/API changes.

Output:

- Dark command center shell
- Existing KPI cards restyled
- Finance AI briefing placeholder
- Quest/action panel placeholder

## Phase 2: Quest and Memory MVP

Goal:

Add basic manually managed company quests and memory input.

Possible data model:

- Quest
- MemoryNote
- DecisionLog

Start simple. Do not overbuild.

Output:

- Quick Add Memory
- Active Quest Board
- Department assignment
- Status and next action

## Phase 3: AI Briefing

Goal:

Generate daily or on-demand CEO briefing from:

- Existing finance data
- Open quests
- Recent memory notes
- Open invoices/quotes

Output:

- Top 3 priorities
- Revenue-linked action
- Blocked issue
- Recommended decision

## Phase 4: Department Agent Views

Goal:

Create dedicated agent views for Finance, Marketing, Planning, and Network first.

Suggested order:

1. Finance AI
2. Marketing AI
3. Planning AI
4. Network AI
5. Production AI
6. R&D AI
7. Culture AI

## Phase 5: Workflow Automation

Goal:

Move from suggestions to approved actions.

Examples:

- Draft quote follow-up email
- Draft invoice reminder
- Generate weekly finance summary
- Create outreach list from a project brief
- Convert meeting note into quests

## Strategic Link

This roadmap supports the BridgeMakers growth loop:

Content -> Interest -> Inquiry -> Meeting -> Contract

The AI OS should always help move work through this loop or protect the company’s operational health.

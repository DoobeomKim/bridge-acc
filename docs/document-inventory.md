# Document Inventory

Last updated: 2026-06-05

## Purpose

This inventory keeps existing production documents, strategy notes, and AI OS planning documents from blending into one unclear pile. The goal is to preserve the current accounting system while creating a clear path toward the BridgeMakers AI Operating System.

## Classification

| Source | Current Role | Decision | Target / Notes |
|---|---|---|---|
| `README.md` | Existing Bridge Acc product overview and usage guide | Keep as current-system source | Summarize into `docs/current-system/01-existing-product-overview.md`; leave original in place |
| `INVOICE_PLAN.md` | Quote/invoice feature plan and legal workflow notes | Keep as current-system source | Summarize into `docs/current-system/02-invoice-quote-system.md`; useful for Finance AI and Quest model |
| `DESIGN_SYSTEM.md` | Existing light, precise accounting UI system | Keep as legacy design baseline | Summarize into `docs/current-system/03-legacy-design-system.md`; future AI OS design should reference but not overwrite blindly |
| `.claude/design-guide.md` | Detailed design guide for the current Bridge Acc UI | Keep as legacy design baseline | Fold into `docs/current-system/03-legacy-design-system.md`; preserve original |
| `VERCEL_SETUP.md` | Deployment and infrastructure guide | Keep as operations reference | Summarize into `docs/current-system/04-deployment-operations.md`; leave original in place |
| `/Users/doobeomkim/Desktop/회사전략고민/260410_bridgemakers_strategy.md` | BridgeMakers growth strategy | Promote into AI OS strategy | Distill into `docs/ai-os/00-product-vision.md` and `06-implementation-roadmap.md` |
| `/Users/doobeomkim/Desktop/회사전략고민/260521_회사를 게임처럼 운영하기.png` | Visual model for company-as-game structure | Reference artifact | Copy/reference from `docs/references/`; core ideas captured in `docs/ai-os/05-agent-model.md` |
| `/Users/doobeomkim/Documents/알고리즘 연구 사이트/concept-ui/bridge-ai-os-mvp.png` | MVP UI concept image | Reference artifact | Copy/reference from `docs/references/`; core UI captured in `docs/ai-os/04-ui-concept.md` |
| `/Users/doobeomkim/Documents/알고리즘 연구 사이트/concept-ui/bridge-ai-os-mvp.html` | Renderable concept UI source | Reference artifact | Copy/reference from `docs/references/` if this project becomes the implementation home |

## Document Rules

- Do not rewrite production docs just because the product direction changed.
- Do not mix raw brainstorming into official AI OS documents.
- Add decisions to `docs/ai-os/07-decision-log.md` when they affect scope, architecture, design direction, or implementation order.
- If a feature touches money, tax, invoices, or existing accounting data, first update the current-system understanding before implementation.

## Next Cleanup Candidates

- Move or copy stable versions of `README.md`, `INVOICE_PLAN.md`, `DESIGN_SYSTEM.md`, and `VERCEL_SETUP.md` into `docs/current-system/` after the AI OS direction settles.
- Copy final concept images into `docs/references/` when the design direction is approved.
- Create a lightweight product changelog once implementation starts.

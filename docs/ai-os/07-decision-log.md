# Decision Log

This file records product decisions that affect AI OS direction, scope, design, or implementation order.

## 2026-06-05

### Decision: Use Bridge Acc as the first implementation base

Bridge Acc already contains accounting data, invoice/quote direction, customers, reports, and operational workflows. It should become the Finance foundation of BridgeMakers AI OS rather than starting from an empty new app.

Impact:

- Existing accounting functions are protected.
- First AI OS work should be design-first and dashboard-first.
- Current app content can be reframed before deeper feature changes.

### Decision: Separate documents into current-system, ai-os, and references

Existing production documents should not be overwritten by new strategy ideas.

Impact:

- `docs/current-system/` stores the current Bridge Acc facts.
- `docs/ai-os/` stores official AI OS direction.
- `docs/references/` stores source inspiration and artifacts.

### Decision: MVP is a CEO Command Center, not autonomous AI company management

The first product should help the CEO see priorities, money-linked actions, blocked issues, quests, and memory. Full autonomous agents are later-stage.

Impact:

- MVP scope stays small.
- Agent cards are role-based surfaces first.
- Automation comes after memory and quest foundations.

### Decision: Use a hybrid visual system

AI OS command screens can use a dark, futuristic HUD style. Accounting detail screens should remain precise and readable.

Impact:

- Avoid turning every form/table into a game UI.
- Start with dashboard and navigation styling.
- Keep legal/finance workflows conservative.

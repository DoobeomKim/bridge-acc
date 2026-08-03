# BridgeMakers AI OS Control Plane

## Purpose

The first implementation establishes a reusable operating control plane rather than a one-off dashboard.

1. `BRIDGE_CONSTITUTION.md` defines stable human-approved values and boundaries.
2. `lib/company-policy.ts` turns critical boundaries into machine-readable defaults.
3. `ApprovalRequest`, `AutomationRun`, and `BusinessBriefing` preserve control and audit history.
4. The daily-updated weekly business-development briefing proves the full scheduled workflow.

## First workflow

```text
Daily Vercel trigger at 07:00 UTC
  -> daily idempotency check
  -> read the previous week's results and the current week's changes
  -> create or update this week's internal briefing
  -> preserve an immutable daily briefing revision
  -> create a human decision request only for a new material decision
  -> wait in Approval Inbox
  -> Doobeom Kim or Eu Ra Jung decides
  -> preserve actor, decision, evidence, and run state
```

The daily trigger is compatible with the Vercel Hobby plan. It runs at 08:00 in Berlin during CET and 09:00 during CEST. Monday opens a new weekly period from the previous week's results; later daily runs update the same weekly briefing without deleting prior revisions.

## Business workspaces

- `company`: shared BridgeMakers operating view
- `bridge`: BridgeMakers services and production
- `fairtale`: Fair Tale market-entry service/platform

The workspaces share skills and policy but do not silently merge positioning, hypotheses, customer data, or metrics.

## Growth path

The same control plane can support the full company loop without replacing the stable finance system:

```text
Market signal -> Lead -> Meeting -> Proposal -> Contract
-> Delivery -> Invoice -> Payment -> Review -> Approved knowledge
```

Each added skill must declare trigger, evidence, output, action mode, approval gate, failure behavior, and idempotency key.

## Deployment requirements

- Apply Prisma migration `20260726090000_add_ai_os_control_plane`.
- Configure `DOOBEOM_PASSWORD_HASH` and `EURA_PASSWORD_HASH` as base64-encoded bcrypt hashes.
- Configure `JWT_SECRET` and `CRON_SECRET` with long random values.
- Keep the legacy `ADMIN_PASSWORD_HASH` only as a temporary Doobeom login fallback during migration.
- Fair Tale currently remains an independently deployed system and a read-only knowledge source for this phase.

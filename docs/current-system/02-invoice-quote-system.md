# Invoice and Quote System

This document summarizes the existing `INVOICE_PLAN.md` direction as current-system context.

## Core Purpose

Bridge Acc includes a quote and invoice management direction designed for German business needs:

- Create and manage quotes.
- Convert accepted quotes into invoices.
- Generate PDFs.
- Track payment state.
- Match invoices with bank transactions.
- Preserve German legal requirements around invoice numbering and corrections.

## Important Product Rules

### Quotes

- Draft quotes can be edited freely.
- Sent quotes should create a new version when materially changed.
- Quotes can support AI assistance for pricing, scope, terms, and negotiation.

### Invoices

- Draft invoices can be edited.
- Sent or paid invoices should not be edited directly.
- Corrections should use cancellation or correction invoice workflows.
- Invoice numbers must remain continuous and auditable.

## AI OS Relevance

This module is a strong candidate for early AI OS value because it connects strategy, sales, finance, and execution.

Potential AI OS features:

- Quote risk check
- Missing line item detection
- Pricing confidence
- Follow-up reminder after quote sent
- Invoice payment follow-up
- Cashflow warning from open invoices

## Implementation Guardrail

Any AI feature in this area must assist decision-making without silently changing legal/accounting records.

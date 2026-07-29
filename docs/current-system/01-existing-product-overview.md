# Existing Product Overview

Bridge Acc is currently a German GmbH accounting management web application. It should be treated as the stable base layer for the future AI OS.

## Existing Core Jobs

- Import bank transactions from Vivid CSV files.
- Detect duplicate transactions.
- Manage transaction categories, VAT rates, notes, search, and sorting.
- Show monthly accounting dashboard.
- Generate accounting reports for tax/accounting submission.
- Manage customers, quotes, invoices, settings, and reports through the current Next.js app.

## Existing Dashboard Concepts

- Income
- Expense
- Net income
- VAT payable
- Category breakdown
- Recent transactions

These are not just UI cards. They are the first reliable data signals for the future Finance AI.

## Existing Technical Base

- Next.js 14 App Router
- React and TypeScript
- Prisma ORM
- SQLite locally, with deployment path toward Vercel Postgres
- Tailwind CSS and shadcn-style components
- CSV parsing, Excel export, PDF generation, file uploads, and AI quote advisor support

## Protected Areas

The following areas should not be changed during design-only passes:

- Transaction import and duplicate detection
- VAT calculation behavior
- Invoice and quote numbering
- Prisma schema and migrations
- Report generation logic
- Authentication and middleware behavior
- Environment variable names and deployment assumptions

## AI OS Reinterpretation

The current Bridge Acc app can become the first department module of BridgeMakers AI OS:

- Current Dashboard -> Finance Command Center
- Transactions -> Transaction Stream
- Reports -> Financial Intelligence
- Quotes / Invoices -> Revenue Quest Pipeline
- Customers -> Client Memory
- Settings -> Company System Config

This means the first AI OS implementation can preserve existing accounting workflows while changing the framing and interface.

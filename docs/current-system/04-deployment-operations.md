# Deployment and Operations

This summarizes the existing deployment assumptions from `VERCEL_SETUP.md`.

## Deployment Target

- Vercel hosting
- Vercel Postgres for production database
- Vercel Blob for file storage
- Prisma migrations for database schema

## Important Environment Variables

- `DATABASE_URL`
- `BLOB_READ_WRITE_TOKEN`
- `FINAPI_CLIENT_ID`
- `FINAPI_CLIENT_SECRET`
- `FINAPI_BASE_URL`
- `TOKEN_ENCRYPTION_KEY`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_APP_URL`

## Operational Guardrails

- Do not break local SQLite development while preparing production Postgres deployment.
- Do not commit real environment files.
- Do not change environment variable names casually.
- Test CSV upload, file attachments, quote/invoice generation, and reports after deployment changes.

## AI OS Relevance

Future AI OS features may require scheduled jobs, background analysis, and memory processing. Those should be planned separately from the existing deployment flow.

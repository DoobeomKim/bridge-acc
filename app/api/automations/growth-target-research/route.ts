import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { executeGrowthTargetResearch } from '@/lib/growth-target-research'

export const runtime = 'nodejs'
export const maxDuration = 300

async function authorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  if (cronSecret && authorization === `Bearer ${cronSecret}`) return true
  const token = getTokenFromRequest(request)
  return token ? Boolean(await verifyToken(token)) : false
}

export async function POST(request: NextRequest) {
  if (!(await authorized(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const run = body.runId
    ? await prisma.automationRun.findFirst({ where: { id: body.runId, skillKey: 'growth-target-research' } })
    : await prisma.automationRun.findFirst({ where: { skillKey: 'growth-target-research', status: 'scheduled' }, orderBy: { createdAt: 'asc' } })
  if (!run) return NextResponse.json({ success: true, skipped: true, reason: 'No scheduled research run' })
  try {
    const completed = await executeGrowthTargetResearch(run.id)
    return NextResponse.json({ success: true, data: completed })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Research failed', runId: run.id }, { status: 500 })
  }
}


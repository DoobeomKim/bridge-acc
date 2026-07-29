import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { executeGrowthProspectDiscovery } from '@/lib/growth-prospect-discovery'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request); const session = token ? await verifyToken(token) : null
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const run = body.runId ? await prisma.automationRun.findFirst({ where: { id: body.runId, skillKey: 'growth-prospect-discovery' } }) : null
  if (!run) return NextResponse.json({ error: 'Scheduled discovery run not found' }, { status: 404 })
  try { return NextResponse.json({ success: true, data: await executeGrowthProspectDiscovery(run.id) }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : '후보 탐색에 실패했습니다.' }, { status: 500 }) }
}

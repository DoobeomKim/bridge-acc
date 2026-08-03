import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { createDailyBusinessBriefing } from '@/lib/weekly-business-briefing'

export const runtime = 'nodejs'

async function authorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  if (cronSecret && authorization === `Bearer ${cronSecret}`) return true
  const token = getTokenFromRequest(request)
  return token ? Boolean(await verifyToken(token)) : false
}

export async function POST(request: NextRequest) {
  if (!(await authorized(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const isCron = request.headers.get('x-vercel-cron') === '1'
  const result = await createDailyBusinessBriefing(new Date(), !isCron)
  return NextResponse.json({ success: true, ...result })
}

export async function GET(request: NextRequest) {
  return POST(request)
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const briefing = await prisma.businessBriefing.findFirst({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ success: true, data: briefing })
}


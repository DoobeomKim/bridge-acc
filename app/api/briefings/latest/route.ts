import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const briefing = await prisma.businessBriefing.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { revisions: { orderBy: { revisionNumber: 'desc' }, take: 14 } },
  })
  return NextResponse.json({ success: true, data: briefing })
}

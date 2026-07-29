import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status') || 'pending'
  const approvals = await prisma.approvalRequest.findMany({
    where: status === 'all' ? undefined : { status },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ success: true, data: approvals })
}


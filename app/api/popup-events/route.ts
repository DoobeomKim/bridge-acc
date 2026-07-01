import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const DEFAULT_EVENT_NAME = '팝업행사'

export async function GET() {
  try {
    let event = await prisma.popupEvent.findFirst({
      where: { isDefault: true },
      include: {
        expenses: {
          orderBy: { date: 'desc' },
          include: {
            attachments: true,
          },
        },
      },
    })

    if (!event) {
      event = await prisma.popupEvent.create({
        data: {
          name: DEFAULT_EVENT_NAME,
          isDefault: true,
        },
        include: {
          expenses: {
            orderBy: { date: 'desc' },
            include: {
              attachments: true,
            },
          },
        },
      })
    }

    return NextResponse.json({ success: true, data: event })
  } catch (error) {
    console.error('Error fetching popup event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch popup event' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, startsAt, endsAt } = body

    if (!id || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, name' },
        { status: 400 }
      )
    }

    const event = await prisma.popupEvent.update({
      where: { id },
      data: {
        name,
        description: description || null,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    })

    return NextResponse.json({ success: true, data: event })
  } catch (error) {
    console.error('Error updating popup event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update popup event' },
      { status: 500 }
    )
  }
}

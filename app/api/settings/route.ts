import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/settings
 * 설정 조회
 */
export async function GET() {
  try {
    let settings = await prisma.settings.findFirst()

    // 설정이 없으면 기본값으로 생성
    if (!settings) {
      settings = await prisma.settings.create({
        data: {},
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch settings',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/settings
 * 설정 업데이트
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    const { companyName, taxNumber, vatId, address, defaultVatRate, fiscalYearStart } = body

    // 기존 설정 찾기
    let settings = await prisma.settings.findFirst()

    const updateData: {
      companyName?: string | null
      taxNumber?: string | null
      vatId?: string | null
      address?: string | null
      defaultVatRate?: number
      fiscalYearStart?: number
    } = {}

    if (companyName !== undefined) updateData.companyName = companyName || null
    if (taxNumber !== undefined) updateData.taxNumber = taxNumber || null
    if (vatId !== undefined) updateData.vatId = vatId || null
    if (address !== undefined) updateData.address = address || null
    if (defaultVatRate !== undefined) updateData.defaultVatRate = defaultVatRate
    if (fiscalYearStart !== undefined) updateData.fiscalYearStart = fiscalYearStart

    if (settings) {
      // 업데이트
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: updateData,
      })
    } else {
      // 생성
      settings = await prisma.settings.create({
        data: updateData,
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update settings',
      },
      { status: 500 }
    )
  }
}

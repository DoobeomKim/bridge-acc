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

    const {
      companyName,
      email,
      taxNumber,
      vatId,
      address,
      defaultVatRate,
      fiscalYearStart,
      hrb,
      managingDirector,
      bankName,
      iban,
      bic,
      sessionDuration,
    } = body

    // 기존 설정 찾기
    let settings = await prisma.settings.findFirst()

    const updateData: {
      companyName?: string | null
      email?: string | null
      taxNumber?: string | null
      vatId?: string | null
      address?: string | null
      defaultVatRate?: number
      fiscalYearStart?: number
      hrb?: string | null
      managingDirector?: string | null
      bankName?: string | null
      iban?: string | null
      bic?: string | null
      sessionDuration?: string
    } = {}

    if (companyName !== undefined) updateData.companyName = companyName || null
    if (email !== undefined) updateData.email = email || null
    if (taxNumber !== undefined) updateData.taxNumber = taxNumber || null
    if (vatId !== undefined) updateData.vatId = vatId || null
    if (address !== undefined) updateData.address = address || null
    if (defaultVatRate !== undefined) updateData.defaultVatRate = defaultVatRate
    if (fiscalYearStart !== undefined) updateData.fiscalYearStart = fiscalYearStart
    if (hrb !== undefined) updateData.hrb = hrb || null
    if (managingDirector !== undefined) updateData.managingDirector = managingDirector || null
    if (bankName !== undefined) updateData.bankName = bankName || null
    if (iban !== undefined) updateData.iban = iban || null
    if (bic !== undefined) updateData.bic = bic || null
    if (sessionDuration !== undefined && ['24h', '7d', '30d-sliding'].includes(sessionDuration)) {
      updateData.sessionDuration = sessionDuration
    }

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

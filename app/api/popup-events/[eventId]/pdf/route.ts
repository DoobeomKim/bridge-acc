import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { PDFDocument } from 'pdf-lib'
import { prisma } from '@/lib/db'
import { PopupEventReportPdf } from '@/components/pdf/popup-event-report-pdf'
import { POPUP_EXPENSE_CATEGORY_LABELS } from '@/types'

export const dynamic = 'force-dynamic'

async function fetchAttachmentBytes(url: string) {
  const response = await fetch(url)
  if (!response.ok) return null
  return new Uint8Array(await response.arrayBuffer())
}

function fitInside(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / width, maxHeight / height)
  return {
    width: width * scale,
    height: height * scale,
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const body = await request.json()
    const selectedExpenseIds = Array.isArray(body.selectedExpenseIds)
      ? body.selectedExpenseIds.filter((id: unknown): id is string => typeof id === 'string')
      : []

    if (selectedExpenseIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No expenses selected' },
        { status: 400 }
      )
    }

    const event = await prisma.popupEvent.findUnique({
      where: { id: params.eventId },
      include: {
        expenses: {
          where: { id: { in: selectedExpenseIds } },
          include: { attachments: true },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Popup event not found' },
        { status: 404 }
      )
    }

    const selectedIdOrder = new Map(selectedExpenseIds.map((id, index) => [id, index]))
    const expenses = event.expenses
      .sort((a, b) => {
        const dateDiff = a.date.getTime() - b.date.getTime()
        if (dateDiff !== 0) return dateDiff
        return (selectedIdOrder.get(a.id) || 0) - (selectedIdOrder.get(b.id) || 0)
      })

    const category = body.category === 'all' ? null : body.category
    const categoryLabel = category
      ? POPUP_EXPENSE_CATEGORY_LABELS[category] || category
      : '전체 카테고리'

    const reportBuffer = await renderToBuffer(
      React.createElement(PopupEventReportPdf, {
        eventName: event.name,
        categoryLabel,
        expenses,
        generatedAt: new Date(),
      })
    )

    const mergedPdf = await PDFDocument.load(reportBuffer)

    for (const expense of expenses) {
      const attachments = [...expense.attachments].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

      for (const attachment of attachments) {
        try {
          const bytes = await fetchAttachmentBytes(attachment.filePath)
          if (!bytes) continue

          if (attachment.mimeType === 'application/pdf') {
            const attachmentPdf = await PDFDocument.load(bytes)
            const copiedPages = await mergedPdf.copyPages(
              attachmentPdf,
              attachmentPdf.getPageIndices()
            )
            copiedPages.forEach((page) => mergedPdf.addPage(page))
            continue
          }

          if (attachment.mimeType === 'image/jpeg' || attachment.mimeType === 'image/jpg' || attachment.mimeType === 'image/png') {
            const image = attachment.mimeType === 'image/png'
              ? await mergedPdf.embedPng(bytes)
              : await mergedPdf.embedJpg(bytes)
            const page = mergedPdf.addPage([595.28, 841.89])
            const margin = 36
            const maxWidth = page.getWidth() - margin * 2
            const maxHeight = page.getHeight() - margin * 2
            const fitted = fitInside(image.width, image.height, maxWidth, maxHeight)
            page.drawImage(image, {
              x: (page.getWidth() - fitted.width) / 2,
              y: (page.getHeight() - fitted.height) / 2,
              width: fitted.width,
              height: fitted.height,
            })
          }
        } catch (attachmentError) {
          console.error('Failed to append popup expense attachment:', {
            attachmentId: attachment.id,
            expenseId: expense.id,
            error: attachmentError,
          })
        }
      }
    }

    const pdfBytes = await mergedPdf.save()
    const date = new Date().toISOString().split('T')[0]
    const filename = `${event.name}_${categoryLabel}_${date}.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error('Error generating popup event PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate popup event PDF' },
      { status: 500 }
    )
  }
}

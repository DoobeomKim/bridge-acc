import ExcelJS from 'exceljs'
import { formatDate } from './utils-accounting'
import { CATEGORY_LABELS } from '@/types'

interface Transaction {
  id: string
  date: Date | string
  amount: number
  currency: string
  description: string
  counterparty: string | null
  category: string | null
  vatRate: number | null
  vatAmount: number | null
  notes: string | null
}

interface ReportSummary {
  totalIncome: number
  totalExpense: number
  netAmount: number
  vatSummary: {
    rate: number
    netAmount: number
    vatAmount: number
    grossAmount: number
  }[]
  categoryBreakdown: {
    category: string
    amount: number
    count: number
  }[]
}

/**
 * Excel 리포트 생성
 */
export async function generateExcelReport(
  transactions: Transaction[],
  summary: ReportSummary,
  period: { startDate: string; endDate: string }
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()

  // 메타데이터
  workbook.creator = 'Bridge Acc'
  workbook.created = new Date()

  // 1. 요약 시트
  const summarySheet = workbook.addWorksheet('요약 (Zusammenfassung)')

  summarySheet.addRow(['독일 GmbH 회계 리포트'])
  summarySheet.addRow([`기간: ${period.startDate} ~ ${period.endDate}`])
  summarySheet.addRow([])

  // 요약 정보
  summarySheet.addRow(['항목', '금액'])
  summarySheet.addRow(['총 수입 (Einnahmen)', summary.totalIncome])
  summarySheet.addRow(['총 지출 (Ausgaben)', -summary.totalExpense])
  summarySheet.addRow(['순이익 (Nettogewinn)', summary.netAmount])
  summarySheet.addRow([])

  // VAT 요약
  summarySheet.addRow(['VAT 요약 (MwSt-Zusammenfassung)'])
  summarySheet.addRow(['세율', '순액', 'VAT 금액', '총액'])
  summary.vatSummary.forEach((vat) => {
    summarySheet.addRow([
      `${vat.rate}%`,
      vat.netAmount,
      vat.vatAmount,
      vat.grossAmount,
    ])
  })
  summarySheet.addRow([])

  // 카테고리별 요약
  summarySheet.addRow(['카테고리별 요약'])
  summarySheet.addRow(['카테고리', '금액', '거래 수'])
  summary.categoryBreakdown.forEach((cat) => {
    summarySheet.addRow([
      CATEGORY_LABELS[cat.category] || cat.category,
      cat.amount,
      cat.count,
    ])
  })

  // 스타일 적용
  summarySheet.getRow(1).font = { bold: true, size: 14 }
  summarySheet.getRow(4).font = { bold: true }
  summarySheet.getRow(10).font = { bold: true }
  summarySheet.getRow(11).font = { bold: true }

  // 열 너비 조정
  summarySheet.columns = [
    { width: 30 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
  ]

  // 2. 거래내역 시트
  const transactionsSheet = workbook.addWorksheet('거래내역 (Transaktionen)')

  // 헤더
  transactionsSheet.addRow([
    '날짜',
    '설명',
    '상대방',
    '금액',
    '통화',
    '카테고리',
    'VAT 세율',
    'VAT 금액',
    '메모',
  ])

  // 헤더 스타일
  const headerRow = transactionsSheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  // 거래내역 데이터
  transactions.forEach((tx) => {
    transactionsSheet.addRow([
      formatDate(tx.date),
      tx.description,
      tx.counterparty || '',
      tx.amount,
      tx.currency,
      tx.category ? CATEGORY_LABELS[tx.category] || tx.category : '',
      tx.vatRate !== null ? `${tx.vatRate}%` : '',
      tx.vatAmount || '',
      tx.notes || '',
    ])
  })

  // 열 너비 조정
  transactionsSheet.columns = [
    { width: 12 }, // 날짜
    { width: 35 }, // 설명
    { width: 25 }, // 상대방
    { width: 12 }, // 금액
    { width: 8 },  // 통화
    { width: 25 }, // 카테고리
    { width: 10 }, // VAT 세율
    { width: 12 }, // VAT 금액
    { width: 30 }, // 메모
  ]

  // 금액 열에 숫자 형식 적용
  transactionsSheet.getColumn(4).numFmt = '#,##0.00'
  transactionsSheet.getColumn(8).numFmt = '#,##0.00'

  // 3. 수입 거래만
  const incomeSheet = workbook.addWorksheet('수입 (Einnahmen)')
  incomeSheet.addRow([
    '날짜',
    '설명',
    '상대방',
    '금액',
    '카테고리',
    'VAT 세율',
    'VAT 금액',
  ])
  incomeSheet.getRow(1).font = { bold: true }
  incomeSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0FFE0' },
  }

  transactions
    .filter((tx) => tx.amount > 0)
    .forEach((tx) => {
      incomeSheet.addRow([
        formatDate(tx.date),
        tx.description,
        tx.counterparty || '',
        tx.amount,
        tx.category ? CATEGORY_LABELS[tx.category] || tx.category : '',
        tx.vatRate !== null ? `${tx.vatRate}%` : '',
        tx.vatAmount || '',
      ])
    })

  incomeSheet.columns = [
    { width: 12 },
    { width: 35 },
    { width: 25 },
    { width: 12 },
    { width: 25 },
    { width: 10 },
    { width: 12 },
  ]

  // 4. 지출 거래만
  const expenseSheet = workbook.addWorksheet('지출 (Ausgaben)')
  expenseSheet.addRow([
    '날짜',
    '설명',
    '상대방',
    '금액',
    '카테고리',
    'VAT 세율',
    'VAT 금액',
  ])
  expenseSheet.getRow(1).font = { bold: true }
  expenseSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFE0E0' },
  }

  transactions
    .filter((tx) => tx.amount < 0)
    .forEach((tx) => {
      expenseSheet.addRow([
        formatDate(tx.date),
        tx.description,
        tx.counterparty || '',
        tx.amount,
        tx.category ? CATEGORY_LABELS[tx.category] || tx.category : '',
        tx.vatRate !== null ? `${tx.vatRate}%` : '',
        tx.vatAmount || '',
      ])
    })

  expenseSheet.columns = [
    { width: 12 },
    { width: 35 },
    { width: 25 },
    { width: 12 },
    { width: 25 },
    { width: 10 },
    { width: 12 },
  ]

  // Excel 파일을 Buffer로 변환
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * CSV 리포트 생성
 */
export function generateCsvReport(transactions: Transaction[]): string {
  const rows = [
    [
      '날짜',
      '설명',
      '상대방',
      '금액',
      '통화',
      '카테고리',
      'VAT 세율',
      'VAT 금액',
      '메모',
    ].join(','),
  ]

  transactions.forEach((tx) => {
    rows.push(
      [
        formatDate(tx.date),
        `"${tx.description.replace(/"/g, '""')}"`,
        tx.counterparty ? `"${tx.counterparty.replace(/"/g, '""')}"` : '',
        tx.amount,
        tx.currency,
        tx.category ? `"${(CATEGORY_LABELS[tx.category] || tx.category).replace(/"/g, '""')}"` : '',
        tx.vatRate !== null ? tx.vatRate : '',
        tx.vatAmount || '',
        tx.notes ? `"${tx.notes.replace(/"/g, '""')}"` : '',
      ].join(',')
    )
  })

  return rows.join('\n')
}

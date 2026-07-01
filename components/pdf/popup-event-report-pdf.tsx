import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import {
  POPUP_EXPENSE_CATEGORY_LABELS,
  POPUP_PAYMENT_METHOD_LABELS,
} from '@/types'

Font.register({
  family: 'Noto Sans KR',
  src: `${process.cwd()}/public/fonts/NotoSansKR-Regular.ttf`,
  fontWeight: 400,
})

Font.register({
  family: 'Noto Sans KR',
  src: `${process.cwd()}/public/fonts/NotoSansKR-Medium.ttf`,
  fontWeight: 500,
})

Font.register({
  family: 'Noto Sans KR',
  src: `${process.cwd()}/public/fonts/NotoSansKR-Bold.ttf`,
  fontWeight: 700,
})

interface PopupExpenseForPdf {
  id: string
  date: Date
  vendor: string
  itemName: string
  category: string | null
  grossAmount: number
  currency: string
  vatRate: number | null
  vatAmount: number | null
  paymentMethod: string | null
  status: string
  notes: string | null
  attachments: { id: string; fileName: string; mimeType: string }[]
}

interface PopupEventReportPdfProps {
  eventName: string
  categoryLabel: string
  expenses: PopupExpenseForPdf[]
  generatedAt: Date
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(value)
}

function formatDate(value: Date) {
  return value.toLocaleDateString('de-DE')
}

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: 'Noto Sans KR',
    fontSize: 9,
    color: '#18181b',
    backgroundColor: '#fafafa',
  },
  header: {
    marginBottom: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
    marginBottom: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
  },
  brand: {
    fontSize: 8,
    color: '#71717a',
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 9,
    color: '#71717a',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  summaryLabel: {
    fontSize: 7,
    color: '#71717a',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 700,
  },
  section: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    color: '#71717a',
    fontSize: 7,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f4f4f5',
  },
  colDate: { width: '12%' },
  colItem: { width: '34%' },
  colCategory: { width: '16%' },
  colMoney: { width: '14%', textAlign: 'right' },
  colStatus: { width: '24%', textAlign: 'right' },
  vendor: {
    fontWeight: 700,
    marginBottom: 2,
  },
  muted: {
    color: '#71717a',
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 28,
    right: 28,
    color: '#a1a1aa',
    fontSize: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

export function PopupEventReportPdf({
  eventName,
  categoryLabel,
  expenses,
  generatedAt,
}: PopupEventReportPdfProps) {
  const currency = expenses[0]?.currency || 'EUR'
  const totalGross = expenses.reduce((sum, expense) => sum + expense.grossAmount, 0)
  const totalVat = expenses.reduce((sum, expense) => sum + (expense.vatAmount || 0), 0)
  const missingAttachments = expenses.filter((expense) => expense.attachments.length === 0).length

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{eventName} 비용 정리</Text>
            <Text style={styles.brand}>Bridgemakers</Text>
          </View>
          <Text style={styles.subtitle}>
            {categoryLabel} · 총 {expenses.length}건 · 생성일 {formatDate(generatedAt)}
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>총 지출</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalGross, currency)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>VAT 합계</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalVat, currency)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>순비용</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalGross - totalVat, currency)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>첨부 누락</Text>
            <Text style={styles.summaryValue}>{missingAttachments}건</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>항목</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>날짜</Text>
            <Text style={styles.colItem}>거래처/항목</Text>
            <Text style={styles.colCategory}>카테고리</Text>
            <Text style={styles.colMoney}>금액</Text>
            <Text style={styles.colStatus}>상태/첨부</Text>
          </View>
          {expenses.map((expense) => (
            <View key={expense.id} style={styles.tableRow}>
              <Text style={styles.colDate}>{formatDate(expense.date)}</Text>
              <View style={styles.colItem}>
                <Text style={styles.vendor}>{expense.vendor}</Text>
                <Text style={styles.muted}>{expense.itemName}</Text>
                {expense.notes && <Text style={styles.muted}>{expense.notes}</Text>}
              </View>
              <Text style={styles.colCategory}>
                {expense.category ? POPUP_EXPENSE_CATEGORY_LABELS[expense.category] || expense.category : '미분류'}
              </Text>
              <Text style={styles.colMoney}>{formatCurrency(expense.grossAmount, expense.currency)}</Text>
              <Text style={styles.colStatus}>
                {expense.status === 'checked' ? '확인완료' : '미확인'} · 첨부 {expense.attachments.length}
                {expense.paymentMethod
                  ? ` · ${POPUP_PAYMENT_METHOD_LABELS[expense.paymentMethod] || expense.paymentMethod}`
                  : ''}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text>{eventName}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

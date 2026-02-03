import { format } from 'date-fns'
import { de } from 'date-fns/locale'

/**
 * 금액을 독일 형식으로 포맷 (1.234,56 €)
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * 날짜를 독일 형식으로 포맷 (DD.MM.YYYY)
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'dd.MM.yyyy', { locale: de })
}

/**
 * 날짜를 ISO 형식으로 포맷 (YYYY-MM-DD) - 데이터베이스용
 */
export function formatDateISO(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'yyyy-MM-dd')
}

/**
 * VAT 금액 계산
 * @param netAmount 순액 (VAT 제외)
 * @param vatRate VAT 세율 (0, 7, 19)
 * @returns VAT 금액
 */
export function calculateVatAmount(netAmount: number, vatRate: number): number {
  return (netAmount * vatRate) / 100
}

/**
 * 총액에서 순액과 VAT 분리
 * @param grossAmount 총액 (VAT 포함)
 * @param vatRate VAT 세율 (0, 7, 19)
 * @returns { netAmount, vatAmount }
 */
export function separateVatFromGross(
  grossAmount: number,
  vatRate: number
): { netAmount: number; vatAmount: number } {
  const netAmount = grossAmount / (1 + vatRate / 100)
  const vatAmount = grossAmount - netAmount
  return {
    netAmount: Math.round(netAmount * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
  }
}

/**
 * 거래가 수입인지 지출인지 판단
 */
export function isIncome(amount: number): boolean {
  return amount > 0
}

/**
 * 거래가 지출인지 판단
 */
export function isExpense(amount: number): boolean {
  return amount < 0
}

/**
 * 카테고리가 수입 카테고리인지 확인
 */
export function isRevenueCategory(category: string | null): boolean {
  if (!category) return false
  return category.startsWith('revenue_')
}

/**
 * 카테고리가 지출 카테고리인지 확인
 */
export function isExpenseCategory(category: string | null): boolean {
  if (!category) return false
  return category.startsWith('expense_')
}

/**
 * UUID 생성 (간단한 버전)
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
}

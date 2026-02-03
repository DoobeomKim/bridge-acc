import Papa from 'papaparse'
import { createHash } from 'crypto'

export interface ParsedTransaction {
  date: Date
  amount: number
  currency: string
  description: string
  counterparty: string | null
  csvRowHash: string
}

export interface CsvParseResult {
  success: boolean
  transactions: ParsedTransaction[]
  errors: string[]
  duplicates: number
}

// Vivid CSV 형식:
// 기존 형식: Booking Date,Value Date,Description,Counterparty,Amount,Currency
// 새로운 형식 1: Internal operation id,Document name,Transaction type,Account IBAN,Transaction status,Transaction date,Counterparty name,Reference,Payment amount,Payment currency
// 새로운 형식 2: Completed date,Counterparty name,Reference,Payment amount,Payment currency
interface VividCsvRow {
  // 기존 형식
  'Booking Date'?: string
  'Value Date'?: string
  'Description'?: string
  'Counterparty'?: string
  'Amount'?: string
  'Currency'?: string

  // 새로운 형식
  'Completed date'?: string
  'Transaction date'?: string
  'Counterparty name'?: string
  'Reference'?: string
  'Payment amount'?: string
  'Payment currency'?: string
  'Transaction type'?: string
  'Transaction status'?: string
}

/**
 * CSV 행에서 해시를 생성하여 중복 방지
 * 날짜를 파싱하여 ISO 형식으로 통일한 후 해시 생성
 */
export function generateCsvRowHash(
  date: string,
  amount: string,
  description: string
): string {
  // 날짜를 파싱하여 ISO 형식으로 통일 (YYYY-MM-DD)
  const parsedDate = parseDate(date)
  const normalizedDate = parsedDate
    ? parsedDate.toISOString().split('T')[0]
    : date

  // 금액에서 공백, 통화 기호, 쉼표 제거하여 정규화
  const normalizedAmount = amount.replace(/[\s€$£¥,]/g, '')

  const hashInput = `${normalizedDate}|${normalizedAmount}|${description.trim()}`
  return createHash('sha256').update(hashInput).digest('hex').substring(0, 16)
}

/**
 * 다양한 날짜 형식을 파싱
 * 지원 형식: DD.MM.YYYY, YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null

  const cleaned = dateString.trim()

  // DD.MM.YYYY (독일 형식)
  const germanFormat = /^(\d{2})\.(\d{2})\.(\d{4})$/
  const germanMatch = cleaned.match(germanFormat)
  if (germanMatch) {
    const [, day, month, year] = germanMatch
    return new Date(`${year}-${month}-${day}`)
  }

  // YYYY-MM-DD (ISO 형식)
  const isoFormat = /^(\d{4})-(\d{2})-(\d{2})$/
  const isoMatch = cleaned.match(isoFormat)
  if (isoMatch) {
    return new Date(cleaned)
  }

  // DD/MM/YYYY
  const slashFormat = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const slashMatch = cleaned.match(slashFormat)
  if (slashMatch) {
    const [, day, month, year] = slashMatch
    return new Date(`${year}-${month}-${day}`)
  }

  // DD-MM-YYYY (새로운 Vivid 형식)
  const dashFormat = /^(\d{2})-(\d{2})-(\d{4})$/
  const dashMatch = cleaned.match(dashFormat)
  if (dashMatch) {
    const [, day, month, year] = dashMatch
    return new Date(`${year}-${month}-${day}`)
  }

  return null
}

/**
 * 금액 문자열을 숫자로 파싱
 * 지원: "1,234.56" (영미식), "1.234,56" (독일식), "-89.99", "1500.00"
 */
export function parseAmount(amountString: string): number | null {
  if (!amountString) return null

  const cleaned = amountString.trim()

  // 괄호로 둘러싸인 음수 (예: "(100.00)")
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    const innerValue = parseAmount(cleaned.slice(1, -1))
    return innerValue !== null ? -innerValue : null
  }

  // 모든 공백 제거
  let normalized = cleaned.replace(/\s+/g, '')

  // 통화 기호 제거 (€, $, 등)
  normalized = normalized.replace(/[€$£¥]/, '')

  // 독일식 형식인지 확인 (점이 천 단위 구분자, 쉼표가 소수 구분자)
  // 예: "1.234,56" -> "1234.56"
  if (/^\-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(normalized)) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  }
  // 영미식 형식 (쉼표가 천 단위 구분자, 점이 소수 구분자)
  // 예: "1,234.56" -> "1234.56"
  else if (/^\-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(normalized)) {
    normalized = normalized.replace(/,/g, '')
  }
  // 쉼표만 있는 경우 (독일식 소수점)
  // 예: "123,45" -> "123.45"
  else if (/^\-?\d+(,\d+)?$/.test(normalized) && !normalized.includes('.')) {
    normalized = normalized.replace(',', '.')
  }

  const parsed = parseFloat(normalized)
  return isNaN(parsed) ? null : parsed
}

/**
 * Vivid CSV 파일을 파싱
 */
export async function parseVividCsv(
  csvContent: string,
  existingHashes: Set<string> = new Set()
): Promise<CsvParseResult> {
  const result: CsvParseResult = {
    success: false,
    transactions: [],
    errors: [],
    duplicates: 0,
  }

  return new Promise((resolve) => {
    Papa.parse<VividCsvRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      delimiter: '', // Auto-detect
      complete: (parseResult) => {
        if (parseResult.errors.length > 0) {
          result.errors = parseResult.errors.map((err) => err.message)
          resolve(result)
          return
        }

        const rows = parseResult.data

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          const rowNumber = i + 2 // +2 because header is row 1 and array is 0-indexed

          // 날짜 필드 확인 (기존 형식 또는 새로운 형식)
          const dateString =
            row['Completed date'] ||
            row['Transaction date'] ||
            row['Booking Date'] ||
            row['Value Date'] ||
            ''

          if (!dateString) {
            result.errors.push(`Row ${rowNumber}: Missing date field`)
            continue
          }

          // 금액 필드 확인 (기존 형식 또는 새로운 형식)
          const amountString = row['Payment amount'] || row['Amount'] || ''

          if (!amountString) {
            result.errors.push(`Row ${rowNumber}: Missing amount field`)
            continue
          }

          // 날짜 파싱
          const date = parseDate(dateString)
          if (!date || isNaN(date.getTime())) {
            result.errors.push(
              `Row ${rowNumber}: Invalid date format: "${dateString}"`
            )
            continue
          }

          // 금액 파싱
          const amount = parseAmount(amountString)
          if (amount === null) {
            result.errors.push(
              `Row ${rowNumber}: Invalid amount format: "${amountString}"`
            )
            continue
          }

          // Description 필드 (기존 형식 또는 새로운 형식의 Reference)
          const description = (
            row['Description'] ||
            row['Reference'] ||
            row['Document name'] ||
            ''
          ).trim()

          // Counterparty 필드
          const counterparty = (
            row['Counterparty name'] ||
            row['Counterparty'] ||
            ''
          ).trim() || null

          // Currency 필드 (€ 기호 제거)
          const currencyRaw = row['Payment currency'] || row['Currency'] || 'EUR'
          const currency = currencyRaw.replace(/[€$£¥]/g, '').trim() || 'EUR'

          // 중복 체크용 해시 생성
          const csvRowHash = generateCsvRowHash(
            dateString,
            amountString,
            description
          )

          // 중복 체크
          if (existingHashes.has(csvRowHash)) {
            result.duplicates++
            continue
          }

          result.transactions.push({
            date,
            amount,
            currency,
            description,
            counterparty,
            csvRowHash,
          })
        }

        result.success = result.errors.length === 0 || result.transactions.length > 0
        resolve(result)
      },
      error: (error: Error) => {
        result.errors.push(`CSV parsing error: ${error.message}`)
        resolve(result)
      },
    })
  })
}

/**
 * 파일 확장자가 CSV인지 확인
 */
export function isValidCsvFile(filename: string): boolean {
  return /\.csv$/i.test(filename)
}

/**
 * 파일 크기가 허용 범위 내인지 확인 (10MB)
 */
export function isValidFileSize(sizeInBytes: number): boolean {
  const maxSize = 10 * 1024 * 1024 // 10MB
  return sizeInBytes <= maxSize
}

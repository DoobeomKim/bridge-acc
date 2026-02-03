// Transaction categories
export const TRANSACTION_CATEGORIES = {
  // 수입 (Einnahmen)
  REVENUE_SALES: 'revenue_sales',
  REVENUE_SERVICES: 'revenue_services',

  // 지출 (Ausgaben)
  EXPENSE_OFFICE: 'expense_office',
  EXPENSE_TRAVEL: 'expense_travel',
  EXPENSE_MARKETING: 'expense_marketing',
  EXPENSE_SOFTWARE: 'expense_software',
  EXPENSE_RENT: 'expense_rent',
  EXPENSE_INSURANCE: 'expense_insurance',
  EXPENSE_UTILITIES: 'expense_utilities',
  EXPENSE_OTHER: 'expense_other',

  // 세금 (Steuern)
  TAX_VAT: 'tax_vat',
  TAX_INCOME: 'tax_income',
} as const

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[keyof typeof TRANSACTION_CATEGORIES]

// VAT rates in Germany
export const VAT_RATES = [0, 7, 19] as const
export type VatRate = typeof VAT_RATES[number]

// Category labels with German translations
export const CATEGORY_LABELS: Record<string, string> = {
  revenue_sales: '판매 수입 (Umsatz)',
  revenue_services: '서비스 수입 (Dienstleistung)',
  expense_office: '사무실 비용 (Bürobedarf)',
  expense_travel: '출장비 (Reisekosten)',
  expense_marketing: '마케팅 (Marketing)',
  expense_software: '소프트웨어 (Software)',
  expense_rent: '임대료 (Miete)',
  expense_insurance: '보험 (Versicherung)',
  expense_utilities: '공과금 (Nebenkosten)',
  expense_other: '기타 지출 (Sonstige)',
  tax_vat: '부가세 (MwSt)',
  tax_income: '소득세 (Einkommensteuer)',
}

// Transaction type
export interface Transaction {
  id: string
  bankAccountId: string
  date: Date
  amount: number
  currency: string
  description: string
  counterparty: string | null
  category: string | null
  subCategory: string | null
  vatRate: number | null
  vatAmount: number | null
  notes: string | null
  tags: string | null
  importBatchId: string | null
  csvRowHash: string | null
  createdAt: Date
  updatedAt: Date
}

// CSV row structure for Vivid
export interface VividCsvRow {
  'Booking Date': string
  'Value Date': string
  'Description': string
  'Counterparty': string
  'Amount': string
  'Currency': string
}

// Report filters
export interface ReportFilters {
  startDate: Date
  endDate: Date
  categories?: string[]
  includeUncategorized?: boolean
}

// Report summary
export interface ReportSummary {
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

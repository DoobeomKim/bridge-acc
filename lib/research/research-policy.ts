export const RESEARCH_POLICY_VERSION = '1.0.0' as const

export const researchItemStatuses = ['confirmed', 'not_found', 'needs_research'] as const
export type ResearchItemStatus = (typeof researchItemStatuses)[number]

export const researchOverallStatuses = ['insufficient', 'partial', 'review_ready'] as const
export type ResearchOverallStatus = (typeof researchOverallStatuses)[number]

export const researchCategories = [
  { key: 'company_identity', label: '회사·법인 기본정보', requiredForReview: true },
  { key: 'business_products', label: '사업·제품', requiredForReview: true },
  { key: 'recent_changes', label: '최근 사업 변화', requiredForReview: true },
  { key: 'marketing_activity', label: '마케팅 활동', requiredForReview: false },
  { key: 'content_maturity', label: '기존 콘텐츠 수준', requiredForReview: false },
  { key: 'hiring_organization', label: '채용·조직 변화', requiredForReview: false },
  { key: 'events_exhibitions', label: '박람회·행사', requiredForReview: false },
  { key: 'procurement_funding', label: '공개입찰·지원사업', requiredForReview: false },
  { key: 'owner_access_path', label: '담당 조직·접근 경로', requiredForReview: true },
  { key: 'meeting_questions', label: '미팅에서 확인할 사항', requiredForReview: true },
] as const

export type ResearchCategoryKey = (typeof researchCategories)[number]['key']

export type ResearchItemResult = {
  category: ResearchCategoryKey
  status: ResearchItemStatus
  summary: string
  facts: string[]
  inferences: string[]
  missingInformation: string[]
  sourceUrls: string[]
  checkedAt: string
  nextSearch: string | null
}

export function deriveResearchOverallStatus(input: {
  items: ResearchItemResult[]
  officialSourceCount: number
}): ResearchOverallStatus {
  const identity = input.items.find((item) => item.category === 'company_identity')
  if (!identity || identity.status !== 'confirmed' || input.officialSourceCount < 1) return 'insufficient'

  const requiredKeys = researchCategories.filter((item) => item.requiredForReview).map((item) => item.key)
  const requiredItems = requiredKeys.map((key) => input.items.find((item) => item.category === key))
  if (requiredItems.some((item) => !item || item.status === 'needs_research')) return 'partial'

  return 'review_ready'
}

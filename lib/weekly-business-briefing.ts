import { endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns'
import { prisma } from '@/lib/db'
import { COMPANY_CONSTITUTION_VERSION } from '@/lib/company-policy'

const SKILL_KEY = 'weekly-business-development-briefing'
const SKILL_VERSION = '1.0.0'

function json(value: unknown) {
  return JSON.stringify(value)
}

export function getBerlinWeekKey(now = new Date()) {
  const berlinDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
  return format(startOfWeek(berlinDate, { weekStartsOn: 1 }), "yyyy-MM-dd")
}

export function isBerlinMondayEight(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const weekday = parts.find((part) => part.type === 'weekday')?.value
  const hour = Number(parts.find((part) => part.type === 'hour')?.value)
  return weekday === 'Mon' && hour === 8
}

export async function createWeeklyBusinessBriefing(now = new Date(), force = false) {
  const periodKey = getBerlinWeekKey(now)
  const triggerKey = `${SKILL_KEY}:${periodKey}`
  const existing = await prisma.automationRun.findUnique({ where: { triggerKey } })
  if (existing && !force) return { created: false, run: existing }

  const berlinNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
  const weekStart = startOfWeek(berlinNow, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(berlinNow, { weekStartsOn: 1 })
  const monthStart = startOfMonth(berlinNow)

  const run = existing ?? await prisma.automationRun.create({
    data: {
      skillKey: SKILL_KEY,
      skillVersion: SKILL_VERSION,
      workspace: 'company',
      triggerType: force ? 'manual' : 'schedule',
      triggerKey,
      status: 'running',
      scheduledFor: now,
      startedAt: now,
      constitutionVersion: COMPANY_CONSTITUTION_VERSION,
    },
  })

  try {
    const [transactions, openQuotes, openInvoices, overdueInvoices] = await Promise.all([
      prisma.transaction.findMany({
        where: { date: { gte: monthStart, lte: now } },
        select: { amount: true, category: true, description: true, date: true },
      }),
      prisma.quote.count({ where: { status: { in: ['draft', 'sent'] } } }),
      prisma.invoice.count({ where: { status: { in: ['draft', 'sent', 'overdue'] } } }),
      prisma.invoice.count({ where: { dueDate: { lt: now }, status: { notIn: ['paid', 'cancelled'] } } }),
    ])

    const income = transactions.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0)
    const expense = Math.abs(transactions.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0))
    const unclassified = transactions.filter((item) => !item.category).length
    const decisions: string[] = []
    const risks: string[] = []

    if (overdueInvoices > 0) decisions.push(`연체 청구서 ${overdueInvoices}건의 후속 조치 승인`)
    if (unclassified > 0) risks.push(`이번 달 미분류 거래 ${unclassified}건`)
    if (income - expense < 0) risks.push('이번 달 순현금흐름이 음수입니다.')
    if (decisions.length === 0) decisions.push('이번 주 최우선 영업 대상과 제안 상품 선택')
    if (risks.length === 0) risks.push('재무 데이터에서 즉시 확인된 고위험 신호 없음')

    const priorities = [
      'BridgeMakers와 Fair Tale의 이번 주 최우선 타깃 기업을 각각 확정합니다.',
      '정체된 문의·미팅·견적의 다음 행동을 지정합니다.',
      '고객 반응과 재무 결과를 다음 주 학습 자료로 남깁니다.',
    ]
    const evidence = {
      generatedAt: now.toISOString(),
      period: { from: weekStart.toISOString(), to: weekEnd.toISOString() },
      sources: ['Transaction', 'Quote', 'Invoice'],
      limitations: ['리드·미팅 데이터 모델은 아직 연결 전입니다.', 'Fair Tale 저장소는 현재 읽기 전용 참조입니다.'],
    }

    const briefing = await prisma.businessBriefing.upsert({
      where: { periodKey },
      update: {
        headline: `이번 주는 영업 대상을 좁히고 후속 행동을 매출 흐름에 연결하는 주입니다.`,
        priorities: json(priorities),
        financeSignals: json({ income, expense, net: income - expense, openInvoices, overdueInvoices }),
        growthSignals: json({ openQuotes, note: '리드와 미팅 데이터 연결 대기' }),
        risks: json(risks),
        decisionsNeeded: json(decisions),
        evidence: json(evidence),
      },
      create: {
        periodKey,
        headline: `이번 주는 영업 대상을 좁히고 후속 행동을 매출 흐름에 연결하는 주입니다.`,
        priorities: json(priorities),
        financeSignals: json({ income, expense, net: income - expense, openInvoices, overdueInvoices }),
        growthSignals: json({ openQuotes, note: '리드와 미팅 데이터 연결 대기' }),
        risks: json(risks),
        decisionsNeeded: json(decisions),
        evidence: json(evidence),
        constitutionVersion: COMPANY_CONSTITUTION_VERSION,
      },
    })

    const approval = run.approvalRequestId
      ? await prisma.approvalRequest.update({
          where: { id: run.approvalRequestId },
          data: {
            status: 'pending',
            decidedBy: null,
            decidedAt: null,
            decisionNote: null,
            summary: decisions.join(' '),
            evidence: json(evidence),
          },
        })
      : await prisma.approvalRequest.create({
          data: {
            title: `${periodKey} 주간 최우선 사업개발 행동 선택`,
            summary: decisions.join(' '),
            actionType: 'strategy_priority_set',
            workspace: 'company',
            riskLevel: 'high',
            evidence: json(evidence),
            proposedPayload: json({ briefingId: briefing.id, priorities, decisions }),
            requestedBy: SKILL_KEY,
            constitutionVersion: COMPANY_CONSTITUTION_VERSION,
          },
        })

    const finishedRun = await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: 'waiting_approval',
        finishedAt: new Date(),
        inputEvidence: json(evidence),
        output: json({ briefingId: briefing.id, periodKey }),
        approvalRequestId: approval.id,
        nextAction: '대표가 브리핑을 검토하고 이번 주 최우선 영업 대상을 선택합니다.',
      },
    })
    return { created: true, run: finishedRun, briefing }
  } catch (error) {
    await prisma.automationRun.update({
      where: { id: run.id },
      data: { status: 'failed', finishedAt: new Date(), error: error instanceof Error ? error.message : 'Unknown error' },
    })
    throw error
  }
}

import { endOfWeek, format, startOfDay, startOfWeek, subWeeks } from 'date-fns'
import { prisma } from '@/lib/db'
import { COMPANY_CONSTITUTION_VERSION } from '@/lib/company-policy'

const SKILL_KEY = 'daily-business-development-briefing'
const SKILL_VERSION = '2.0.0'

function json(value: unknown) {
  return JSON.stringify(value)
}

function berlinDate(now: Date) {
  return new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
}

export function getBerlinWeekKey(now = new Date()) {
  return format(startOfWeek(berlinDate(now), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function getBerlinDateKey(now = new Date()) {
  return format(startOfDay(berlinDate(now)), 'yyyy-MM-dd')
}

function sumTransactions(items: Array<{ amount: number }>) {
  const income = items.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0)
  const expense = Math.abs(items.filter((item) => item.amount < 0).reduce((sum, item) => sum + item.amount, 0))
  return { income, expense, net: income - expense }
}

export async function createDailyBusinessBriefing(now = new Date(), force = false) {
  const localNow = berlinDate(now)
  const periodKey = getBerlinWeekKey(now)
  const dateKey = getBerlinDateKey(now)
  const triggerKey = force ? `${SKILL_KEY}:${dateKey}:${crypto.randomUUID()}` : `${SKILL_KEY}:${dateKey}`
  const existingRun = await prisma.automationRun.findUnique({ where: { triggerKey } })
  if (existingRun && !force) return { created: false, run: existingRun }

  const currentWeekStart = startOfWeek(localNow, { weekStartsOn: 1 })
  const currentWeekEnd = endOfWeek(localNow, { weekStartsOn: 1 })
  const previousWeekStart = startOfWeek(subWeeks(localNow, 1), { weekStartsOn: 1 })
  const previousWeekEnd = endOfWeek(subWeeks(localNow, 1), { weekStartsOn: 1 })

  const run = await prisma.automationRun.create({
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
    const [previousTransactions, currentTransactions, openQuotes, openInvoices, overdueInvoices, previousLeads, currentLeads, previousRuns, currentRuns] = await Promise.all([
      prisma.transaction.findMany({ where: { date: { gte: previousWeekStart, lte: previousWeekEnd } }, select: { amount: true, category: true } }),
      prisma.transaction.findMany({ where: { date: { gte: currentWeekStart, lte: now } }, select: { amount: true, category: true } }),
      prisma.quote.count({ where: { status: { in: ['draft', 'sent'] } } }),
      prisma.invoice.count({ where: { status: { in: ['draft', 'sent', 'overdue'] } } }),
      prisma.invoice.count({ where: { dueDate: { lt: now }, status: { notIn: ['paid', 'cancelled'] } } }),
      prisma.growthLead.count({ where: { createdAt: { gte: previousWeekStart, lte: previousWeekEnd } } }),
      prisma.growthLead.count({ where: { createdAt: { gte: currentWeekStart, lte: now } } }),
      prisma.automationRun.count({ where: { createdAt: { gte: previousWeekStart, lte: previousWeekEnd }, status: 'completed' } }),
      prisma.automationRun.count({ where: { createdAt: { gte: currentWeekStart, lte: now }, status: 'completed' } }),
    ])

    const previousFinance = sumTransactions(previousTransactions)
    const currentFinance = sumTransactions(currentTransactions)
    const unclassified = currentTransactions.filter((item) => !item.category).length
    const previousWeekReview = {
      period: { from: previousWeekStart.toISOString(), to: previousWeekEnd.toISOString() },
      finance: previousFinance,
      newLeads: previousLeads,
      completedAutomations: previousRuns,
    }
    const currentWeekStatus = {
      period: { from: currentWeekStart.toISOString(), to: currentWeekEnd.toISOString() },
      finance: currentFinance,
      newLeads: currentLeads,
      completedAutomations: currentRuns,
      openQuotes,
      openInvoices,
      overdueInvoices,
    }

    const decisions: string[] = []
    const risks: string[] = []
    if (overdueInvoices > 0) decisions.push(`연체 청구서 ${overdueInvoices}건의 후속 조치를 결정합니다.`)
    if (unclassified > 0) risks.push(`이번 주 미분류 거래 ${unclassified}건을 확인해야 합니다.`)
    if (currentFinance.net < 0) risks.push('이번 주 순현금흐름이 음수입니다.')
    if (decisions.length === 0) decisions.push('이번 주 최우선 사업개발 대상과 다음 행동을 선택합니다.')
    if (risks.length === 0) risks.push('현재 데이터에서 즉시 확인할 고위험 신호는 없습니다.')

    const priorities = [
      '지난주 결과와 이번 주 변화량을 함께 검토합니다.',
      '가장 가능성이 높은 영업 대상의 다음 행동을 하나 확정합니다.',
      '승인된 행동의 결과를 다음 일일 갱신과 다음 주 회고에 연결합니다.',
    ]
    const evidence = {
      generatedAt: now.toISOString(),
      dateKey,
      previousWeekReview,
      currentWeekStatus,
      sources: ['Transaction', 'Quote', 'Invoice', 'GrowthLead', 'AutomationRun'],
      limitations: ['미팅과 계약 결과는 해당 데이터가 시스템에 기록된 범위에서만 반영됩니다.'],
    }
    const headline = `지난주 결과를 기준으로 이번 주 현황을 ${dateKey} 기준으로 갱신했습니다.`
    const snapshot = { headline, priorities, previousWeekReview, currentWeekStatus, risks, decisionsNeeded: decisions, evidence }

    const briefing = await prisma.businessBriefing.upsert({
      where: { periodKey },
      update: {
        headline,
        priorities: json(priorities),
        financeSignals: json({ previousWeek: previousFinance, currentWeek: currentFinance, openInvoices, overdueInvoices }),
        growthSignals: json({ previousWeekLeads: previousLeads, currentWeekLeads: currentLeads, openQuotes }),
        risks: json(risks),
        decisionsNeeded: json(decisions),
        evidence: json(evidence),
      },
      create: {
        periodKey,
        headline,
        priorities: json(priorities),
        financeSignals: json({ previousWeek: previousFinance, currentWeek: currentFinance, openInvoices, overdueInvoices }),
        growthSignals: json({ previousWeekLeads: previousLeads, currentWeekLeads: currentLeads, openQuotes }),
        risks: json(risks),
        decisionsNeeded: json(decisions),
        evidence: json(evidence),
        constitutionVersion: COMPANY_CONSTITUTION_VERSION,
      },
    })

    const revisionCount = await prisma.businessBriefingRevision.count({ where: { briefingId: briefing.id } })
    const priorRevision = await prisma.businessBriefingRevision.findFirst({ where: { briefingId: briefing.id }, orderBy: { revisionNumber: 'desc' } })
    const changeSummary = priorRevision
      ? `${dateKey}: 지난 갱신 이후 재무·성장·승인 대기 신호를 다시 계산했습니다.`
      : `${dateKey}: 지난주 회고를 기준으로 이번 주 최초 브리핑을 생성했습니다.`

    const revision = await prisma.businessBriefingRevision.upsert({
      where: { briefingId_dateKey: { briefingId: briefing.id, dateKey } },
      update: { snapshot: json(snapshot), changeSummary, evidence: json(evidence), automationRunId: run.id },
      create: {
        briefingId: briefing.id,
        dateKey,
        revisionNumber: revisionCount + 1,
        snapshot: json(snapshot),
        changeSummary,
        evidence: json(evidence),
        automationRunId: run.id,
        constitutionVersion: COMPANY_CONSTITUTION_VERSION,
      },
    })

    const latestApproval = await prisma.approvalRequest.findFirst({
      where: { actionType: 'strategy_priority_set', workspace: 'company' },
      orderBy: { createdAt: 'desc' },
    })
    const proposedPayload = json({ briefingId: briefing.id, periodKey, revisionId: revision.id, priorities, decisions })
    const decisionSignature = json({ priorities, decisions })
    let latestDecisionSignature = ''
    try {
      const previousPayload = latestApproval?.proposedPayload ? JSON.parse(latestApproval.proposedPayload) : null
      latestDecisionSignature = previousPayload ? json({ priorities: previousPayload.priorities, decisions: previousPayload.decisions }) : ''
    } catch {}
    let approval = null
    let approvalForRun = null
    if (latestApproval?.status === 'pending') {
      approval = await prisma.approvalRequest.update({
        where: { id: latestApproval.id },
        data: { title: `${periodKey} 이번 주 사업개발 행동 선택`, summary: decisions.join(' '), evidence: json(evidence), proposedPayload },
      })
    } else if (!latestApproval || latestDecisionSignature !== decisionSignature) {
      approval = await prisma.approvalRequest.create({
        data: {
          title: `${periodKey} 이번 주 사업개발 행동 선택`,
          summary: decisions.join(' '),
          actionType: 'strategy_priority_set',
          workspace: 'company',
          riskLevel: 'high',
          evidence: json(evidence),
          proposedPayload,
          requestedBy: SKILL_KEY,
          constitutionVersion: COMPANY_CONSTITUTION_VERSION,
        },
      })
      approvalForRun = approval
    }

    const finishedRun = await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: approval ? 'waiting_approval' : 'completed',
        finishedAt: new Date(),
        inputEvidence: json({ previousWeekReview, currentWeekStatus }),
        output: json({ briefingId: briefing.id, periodKey, revisionId: revision.id, snapshot }),
        approvalRequestId: approvalForRun?.id,
        nextAction: approval ? '이번 주 브리핑 변경점을 검토하고 우선 행동을 선택합니다.' : '승인된 행동의 실행 결과를 기록합니다.',
      },
    })
    return { created: true, run: finishedRun, briefing, revision }
  } catch (error) {
    await prisma.automationRun.update({
      where: { id: run.id },
      data: { status: 'failed', finishedAt: new Date(), error: error instanceof Error ? error.message : 'Unknown error' },
    })
    throw error
  }
}

export const createWeeklyBusinessBriefing = createDailyBusinessBriefing

CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "workspace" TEXT NOT NULL DEFAULT 'bridge',
    "riskLevel" TEXT NOT NULL DEFAULT 'high',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "evidence" TEXT,
    "proposedPayload" TEXT,
    "requestedBy" TEXT NOT NULL DEFAULT 'system',
    "constitutionVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "decidedBy" TEXT,
    "decisionNote" TEXT,
    "decidedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL,
    "skillKey" TEXT NOT NULL,
    "skillVersion" TEXT NOT NULL,
    "workspace" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduledFor" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "inputEvidence" TEXT,
    "output" TEXT,
    "error" TEXT,
    "nextAction" TEXT,
    "constitutionVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "approvalRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessBriefing" (
    "id" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "workspace" TEXT NOT NULL DEFAULT 'company',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "headline" TEXT NOT NULL,
    "priorities" TEXT NOT NULL,
    "financeSignals" TEXT NOT NULL,
    "growthSignals" TEXT NOT NULL,
    "risks" TEXT NOT NULL,
    "decisionsNeeded" TEXT NOT NULL,
    "evidence" TEXT,
    "constitutionVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessBriefing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AutomationRun_triggerKey_key" ON "AutomationRun"("triggerKey");
CREATE UNIQUE INDEX "AutomationRun_approvalRequestId_key" ON "AutomationRun"("approvalRequestId");
CREATE UNIQUE INDEX "BusinessBriefing_periodKey_key" ON "BusinessBriefing"("periodKey");
CREATE INDEX "ApprovalRequest_status_createdAt_idx" ON "ApprovalRequest"("status", "createdAt");
CREATE INDEX "ApprovalRequest_workspace_status_idx" ON "ApprovalRequest"("workspace", "status");
CREATE INDEX "AutomationRun_status_scheduledFor_idx" ON "AutomationRun"("status", "scheduledFor");
CREATE INDEX "AutomationRun_skillKey_createdAt_idx" ON "AutomationRun"("skillKey", "createdAt");
CREATE INDEX "AutomationRun_workspace_createdAt_idx" ON "AutomationRun"("workspace", "createdAt");
CREATE INDEX "BusinessBriefing_createdAt_idx" ON "BusinessBriefing"("createdAt");
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

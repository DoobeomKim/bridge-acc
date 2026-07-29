CREATE TABLE "GrowthCampaign" (
    "id" TEXT NOT NULL,
    "workspace" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "offer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "successCriteria" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GrowthCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GrowthLead" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "country" TEXT,
    "industry" TEXT,
    "contactName" TEXT,
    "contactRole" TEXT,
    "contactChannel" TEXT,
    "sourceUrl" TEXT,
    "evidence" TEXT,
    "researchSummary" TEXT,
    "uncertainties" TEXT,
    "fitScore" INTEGER,
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
    "stage" TEXT NOT NULL DEFAULT 'discovered',
    "nextAction" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GrowthLead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GrowthOutreachDraft" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'de',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "rationale" TEXT,
    "evidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "payloadHash" TEXT NOT NULL,
    "approvalRequestId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GrowthOutreachDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GrowthOutreachDraft_approvalRequestId_key" ON "GrowthOutreachDraft"("approvalRequestId");
CREATE INDEX "GrowthCampaign_workspace_status_idx" ON "GrowthCampaign"("workspace", "status");
CREATE INDEX "GrowthCampaign_createdAt_idx" ON "GrowthCampaign"("createdAt");
CREATE INDEX "GrowthLead_campaignId_stage_idx" ON "GrowthLead"("campaignId", "stage");
CREATE INDEX "GrowthLead_campaignId_reviewStatus_idx" ON "GrowthLead"("campaignId", "reviewStatus");
CREATE INDEX "GrowthLead_companyName_idx" ON "GrowthLead"("companyName");
CREATE INDEX "GrowthOutreachDraft_leadId_status_idx" ON "GrowthOutreachDraft"("leadId", "status");
CREATE INDEX "GrowthOutreachDraft_createdAt_idx" ON "GrowthOutreachDraft"("createdAt");

ALTER TABLE "GrowthLead" ADD CONSTRAINT "GrowthLead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "GrowthCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrowthOutreachDraft" ADD CONSTRAINT "GrowthOutreachDraft_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "GrowthLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrowthOutreachDraft" ADD CONSTRAINT "GrowthOutreachDraft_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

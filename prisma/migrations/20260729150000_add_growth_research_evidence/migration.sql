ALTER TABLE "GrowthLead" ADD COLUMN "researchRunId" TEXT;
ALTER TABLE "GrowthLead" ADD COLUMN "facts" TEXT;
ALTER TABLE "GrowthLead" ADD COLUMN "inferences" TEXT;
ALTER TABLE "GrowthLead" ADD COLUMN "confidence" INTEGER;
ALTER TABLE "GrowthLead" ADD COLUMN "sourceCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "GrowthResearchSource" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "leadId" TEXT,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "pageAge" TEXT,
    "contentHash" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrowthResearchSource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GrowthLead_researchRunId_idx" ON "GrowthLead"("researchRunId");
CREATE INDEX "GrowthResearchSource_runId_url_idx" ON "GrowthResearchSource"("runId", "url");
CREATE INDEX "GrowthResearchSource_leadId_idx" ON "GrowthResearchSource"("leadId");
CREATE INDEX "GrowthResearchSource_retrievedAt_idx" ON "GrowthResearchSource"("retrievedAt");

ALTER TABLE "GrowthLead" ADD CONSTRAINT "GrowthLead_researchRunId_fkey" FOREIGN KEY ("researchRunId") REFERENCES "AutomationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GrowthResearchSource" ADD CONSTRAINT "GrowthResearchSource_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AutomationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GrowthResearchSource" ADD CONSTRAINT "GrowthResearchSource_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "GrowthLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

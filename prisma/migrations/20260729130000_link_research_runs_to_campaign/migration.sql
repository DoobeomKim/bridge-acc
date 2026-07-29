ALTER TABLE "AutomationRun" ADD COLUMN "campaignId" TEXT;

CREATE INDEX "AutomationRun_campaignId_createdAt_idx" ON "AutomationRun"("campaignId", "createdAt");

ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "GrowthCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

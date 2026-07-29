ALTER TABLE "GrowthLead" ADD COLUMN "customerId" TEXT;
ALTER TABLE "GrowthLead" ADD COLUMN "researchPurpose" TEXT;
ALTER TABLE "GrowthLead" ADD COLUMN "researchQuestion" TEXT;
ALTER TABLE "GrowthLead" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE "GrowthLead" ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT 'manual';

CREATE UNIQUE INDEX "GrowthLead_campaignId_customerId_key" ON "GrowthLead"("campaignId", "customerId");
CREATE INDEX "GrowthLead_customerId_idx" ON "GrowthLead"("customerId");

ALTER TABLE "GrowthLead" ADD CONSTRAINT "GrowthLead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

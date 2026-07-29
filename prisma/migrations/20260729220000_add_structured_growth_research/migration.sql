ALTER TABLE "GrowthLead" ADD COLUMN "researchDetails" TEXT;
ALTER TABLE "GrowthLead" ADD COLUMN "researchOverallStatus" TEXT NOT NULL DEFAULT 'insufficient';
ALTER TABLE "GrowthLead" ADD COLUMN "researchPolicyVersion" TEXT;
ALTER TABLE "GrowthLead" ADD COLUMN "opportunityScore" INTEGER;
ALTER TABLE "GrowthLead" ADD COLUMN "actionabilityScore" INTEGER;

CREATE INDEX "GrowthLead_researchOverallStatus_idx" ON "GrowthLead"("researchOverallStatus");

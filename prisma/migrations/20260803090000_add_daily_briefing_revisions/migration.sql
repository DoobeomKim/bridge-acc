CREATE TABLE "BusinessBriefingRevision" (
    "id" TEXT NOT NULL,
    "briefingId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "changeSummary" TEXT,
    "evidence" TEXT,
    "automationRunId" TEXT,
    "constitutionVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessBriefingRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessBriefingRevision_briefingId_dateKey_key" ON "BusinessBriefingRevision"("briefingId", "dateKey");
CREATE UNIQUE INDEX "BusinessBriefingRevision_briefingId_revisionNumber_key" ON "BusinessBriefingRevision"("briefingId", "revisionNumber");
CREATE INDEX "BusinessBriefingRevision_createdAt_idx" ON "BusinessBriefingRevision"("createdAt");
CREATE INDEX "BusinessBriefingRevision_automationRunId_idx" ON "BusinessBriefingRevision"("automationRunId");

ALTER TABLE "BusinessBriefingRevision"
ADD CONSTRAINT "BusinessBriefingRevision_briefingId_fkey"
FOREIGN KEY ("briefingId") REFERENCES "BusinessBriefing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

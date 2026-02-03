-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NumberSequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL DEFAULT 0,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_NumberSequence" ("createdAt", "id", "lastNumber", "month", "type", "updatedAt", "year") SELECT "createdAt", "id", "lastNumber", coalesce("month", 0) AS "month", "type", "updatedAt", "year" FROM "NumberSequence";
DROP TABLE "NumberSequence";
ALTER TABLE "new_NumberSequence" RENAME TO "NumberSequence";
CREATE INDEX "NumberSequence_type_year_idx" ON "NumberSequence"("type", "year");
CREATE UNIQUE INDEX "NumberSequence_type_year_month_key" ON "NumberSequence"("type", "year", "month");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

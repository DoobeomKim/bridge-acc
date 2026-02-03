-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "source" TEXT;

-- CreateTable
CREATE TABLE "BankConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankName" TEXT NOT NULL,
    "connectionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" DATETIME,
    "externalAccountId" TEXT,
    "lastSyncAt" DATETIME,
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "syncFrequency" INTEGER NOT NULL DEFAULT 3600,
    "bankAccountId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BankConnection_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BankConnection_bankAccountId_key" ON "BankConnection"("bankAccountId");

-- CreateIndex
CREATE INDEX "BankConnection_status_idx" ON "BankConnection"("status");

-- CreateIndex
CREATE INDEX "BankConnection_lastSyncAt_idx" ON "BankConnection"("lastSyncAt");

-- CreateIndex
CREATE INDEX "Transaction_externalId_idx" ON "Transaction"("externalId");

-- CreateIndex
CREATE INDEX "Transaction_source_idx" ON "Transaction"("source");

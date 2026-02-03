-- CreateTable
CREATE TABLE "NumberSequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'DE',
    "vatId" TEXT,
    "taxExempt" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteNumber" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "originalQuoteId" TEXT,
    "supersededById" TEXT,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "totalVat" REAL NOT NULL DEFAULT 0,
    "totalGross" REAL NOT NULL DEFAULT 0,
    "validUntil" DATETIME NOT NULL,
    "notes" TEXT,
    "terms" TEXT,
    "aiSuggestions" TEXT,
    "sentAt" DATETIME,
    "acceptedAt" DATETIME,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "lastEditedAt" DATETIME,
    "editHistory" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_originalQuoteId_fkey" FOREIGN KEY ("originalQuoteId") REFERENCES "Quote" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Quote_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "Quote" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'Stück',
    "unitPrice" REAL NOT NULL,
    "vatRate" REAL NOT NULL DEFAULT 19,
    "subtotal" REAL NOT NULL,
    "vatAmount" REAL NOT NULL,
    "total" REAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "quoteId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subtotal" REAL NOT NULL DEFAULT 0,
    "totalVat" REAL NOT NULL DEFAULT 0,
    "totalGross" REAL NOT NULL DEFAULT 0,
    "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" DATETIME,
    "dueDate" DATETIME NOT NULL,
    "paymentTerms" TEXT NOT NULL DEFAULT '14 Tage netto',
    "paidAt" DATETIME,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "notes" TEXT,
    "terms" TEXT,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" DATETIME,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" DATETIME,
    "cancellationReason" TEXT,
    "correctionType" TEXT,
    "correctsId" TEXT,
    "correctedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_correctsId_fkey" FOREIGN KEY ("correctsId") REFERENCES "Invoice" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'Stück',
    "unitPrice" REAL NOT NULL,
    "vatRate" REAL NOT NULL DEFAULT 19,
    "subtotal" REAL NOT NULL,
    "vatAmount" REAL NOT NULL,
    "total" REAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT,
    "taxNumber" TEXT,
    "vatId" TEXT,
    "address" TEXT,
    "defaultVatRate" REAL NOT NULL DEFAULT 19,
    "fiscalYearStart" INTEGER NOT NULL DEFAULT 1,
    "quotePrefix" TEXT NOT NULL DEFAULT 'BM-ANB',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'BM',
    "numberFormat" TEXT NOT NULL DEFAULT 'YEAR',
    "numberPadding" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("address", "companyName", "createdAt", "defaultVatRate", "fiscalYearStart", "id", "taxNumber", "updatedAt", "vatId") SELECT "address", "companyName", "createdAt", "defaultVatRate", "fiscalYearStart", "id", "taxNumber", "updatedAt", "vatId" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "NumberSequence_type_year_idx" ON "NumberSequence"("type", "year");

-- CreateIndex
CREATE UNIQUE INDEX "NumberSequence_type_year_month_key" ON "NumberSequence"("type", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerNumber_key" ON "Customer"("customerNumber");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_supersededById_key" ON "Quote"("supersededById");

-- CreateIndex
CREATE INDEX "Quote_customerId_idx" ON "Quote"("customerId");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "Quote_quoteNumber_idx" ON "Quote"("quoteNumber");

-- CreateIndex
CREATE INDEX "QuoteItem_quoteId_idx" ON "QuoteItem"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_quoteId_key" ON "Invoice"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_transactionId_key" ON "Invoice"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_correctsId_key" ON "Invoice"("correctsId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_correctedById_key" ON "Invoice"("correctedById");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_invoiceDate_idx" ON "Invoice"("invoiceDate");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

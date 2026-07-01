-- CreateTable
CREATE TABLE "PopupEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PopupEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PopupExpense" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "vendor" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "vatRate" DOUBLE PRECISION,
    "vatAmount" DOUBLE PRECISION,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unchecked',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PopupExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PopupExpenseAttachment" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PopupExpenseAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PopupEvent_isDefault_idx" ON "PopupEvent"("isDefault");

-- CreateIndex
CREATE INDEX "PopupEvent_startsAt_idx" ON "PopupEvent"("startsAt");

-- CreateIndex
CREATE INDEX "PopupExpense_eventId_idx" ON "PopupExpense"("eventId");

-- CreateIndex
CREATE INDEX "PopupExpense_date_idx" ON "PopupExpense"("date");

-- CreateIndex
CREATE INDEX "PopupExpense_category_idx" ON "PopupExpense"("category");

-- CreateIndex
CREATE INDEX "PopupExpense_status_idx" ON "PopupExpense"("status");

-- CreateIndex
CREATE INDEX "PopupExpenseAttachment_expenseId_idx" ON "PopupExpenseAttachment"("expenseId");

-- AddForeignKey
ALTER TABLE "PopupExpense" ADD CONSTRAINT "PopupExpense_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "PopupEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PopupExpenseAttachment" ADD CONSTRAINT "PopupExpenseAttachment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "PopupExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

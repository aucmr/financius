-- Add import provenance, batch tracking, and stable row fingerprints.
CREATE TYPE "ImportSource" AS ENUM ('XP', 'BTG', 'BB');

CREATE TYPE "ImportBatchStatus" AS ENUM ('COMPLETED', 'PARTIAL', 'FAILED');

CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "ImportSource" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileFingerprint" TEXT NOT NULL,
    "statementDate" DATE,
    "status" "ImportBatchStatus" NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "importedRows" INTEGER NOT NULL,
    "ignoredRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Expense"
    ADD COLUMN "importBatchId" TEXT,
    ADD COLUMN "importFingerprint" TEXT,
    ADD COLUMN "importRowNumber" INTEGER,
    ADD COLUMN "importMetadata" JSONB;

CREATE INDEX "ImportBatch_householdId_createdAt_idx" ON "ImportBatch"("householdId", "createdAt");
CREATE INDEX "ImportBatch_householdId_fileFingerprint_idx" ON "ImportBatch"("householdId", "fileFingerprint");
CREATE INDEX "Expense_householdId_importFingerprint_idx" ON "Expense"("householdId", "importFingerprint");
CREATE INDEX "Expense_importBatchId_idx" ON "Expense"("importBatchId");

ALTER TABLE "ImportBatch"
    ADD CONSTRAINT "ImportBatch_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ImportBatch"
    ADD CONSTRAINT "ImportBatch_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Expense"
    ADD CONSTRAINT "Expense_importBatchId_fkey"
    FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "responsibleUserId" TEXT;

-- Backfill existing rows so the new required relation can be enforced safely.
UPDATE "Expense"
SET "responsibleUserId" = "userId"
WHERE "responsibleUserId" IS NULL;

ALTER TABLE "Expense" ALTER COLUMN "responsibleUserId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

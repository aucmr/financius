-- AlterTable
ALTER TABLE "Income" ADD COLUMN     "ownerUserId" TEXT;

-- Backfill existing rows with the creating user as the initial owner.
UPDATE "Income"
SET "ownerUserId" = "userId"
WHERE "ownerUserId" IS NULL;

ALTER TABLE "Income" ALTER COLUMN "ownerUserId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

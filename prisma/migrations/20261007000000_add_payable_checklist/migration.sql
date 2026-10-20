CREATE TABLE "PayableItem" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultKey" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "PayableItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PayableItemMonthlyStatus" (
    "id" TEXT NOT NULL,
    "payableItemId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayableItemMonthlyStatus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayableItem_householdId_defaultKey_key"
    ON "PayableItem"("householdId", "defaultKey");
CREATE INDEX "PayableItem_householdId_archivedAt_sortOrder_idx"
    ON "PayableItem"("householdId", "archivedAt", "sortOrder");
CREATE UNIQUE INDEX "PayableItemMonthlyStatus_payableItemId_year_month_key"
    ON "PayableItemMonthlyStatus"("payableItemId", "year", "month");

ALTER TABLE "PayableItem"
    ADD CONSTRAINT "PayableItem_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PayableItemMonthlyStatus"
    ADD CONSTRAINT "PayableItemMonthlyStatus_payableItemId_fkey"
    FOREIGN KEY ("payableItemId") REFERENCES "PayableItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

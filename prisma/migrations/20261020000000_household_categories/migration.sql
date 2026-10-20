ALTER TABLE "Category"
ADD COLUMN "householdId" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "archivedAt" TIMESTAMP(3);

ALTER TABLE "AreaSubcategory"
ADD COLUMN "archivedAt" TIMESTAMP(3);

DROP INDEX "Category_name_kind_key";

CREATE UNIQUE INDEX "Category_householdId_name_kind_key"
ON "Category"("householdId", "name", "kind");

CREATE INDEX "Category_household_category_order_idx"
ON "Category"("householdId", "kind", "type", "archivedAt", "sortOrder");

CREATE INDEX "AreaSubcategory_active_idx"
ON "AreaSubcategory"("areaCategoryId", "archivedAt");

ALTER TABLE "Category"
ADD CONSTRAINT "Category_householdId_fkey"
FOREIGN KEY ("householdId") REFERENCES "Household"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Category" (
    "id",
    "householdId",
    "name",
    "kind",
    "type",
    "color",
    "icon",
    "sortOrder",
    "createdAt",
    "updatedAt"
)
SELECT
    'cat_' || source."id" || '_' || household."id",
    household."id",
    source."name",
    source."kind",
    source."type",
    source."color",
    source."icon",
    (
        ROW_NUMBER() OVER (
            PARTITION BY household."id", source."kind", source."type"
            ORDER BY source."name", source."id"
        ) - 1
    )::INTEGER,
    source."createdAt",
    source."updatedAt"
FROM "Category" source
CROSS JOIN "Household" household
WHERE source."householdId" IS NULL;

INSERT INTO "AreaSubcategory" (
    "id",
    "name",
    "areaCategoryId",
    "createdAt",
    "updatedAt"
)
SELECT
    'sub_' || subcategory."id" || '_' || household."id",
    subcategory."name",
    'cat_' || source."id" || '_' || household."id",
    subcategory."createdAt",
    subcategory."updatedAt"
FROM "AreaSubcategory" subcategory
JOIN "Category" source ON source."id" = subcategory."areaCategoryId"
CROSS JOIN "Household" household
WHERE source."householdId" IS NULL;

UPDATE "Expense"
SET
    "areaCategoryId" = 'cat_' || "areaCategoryId" || '_' || "householdId",
    "areaSubcategoryId" = 'sub_' || "areaSubcategoryId" || '_' || "householdId",
    "profileCategoryId" = 'cat_' || "profileCategoryId" || '_' || "householdId";

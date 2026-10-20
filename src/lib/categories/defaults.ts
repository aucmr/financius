import type { Prisma } from "../../../prisma/generated/client";
import { CategoryKind, TransactionType } from "../../../prisma/generated/enums";

import {
  DEFAULT_AREA_CATEGORY_CATALOG,
  DEFAULT_PROFILE_CATEGORY_CATALOG,
} from "./catalog";

type CategoryCatalogClient = Pick<
  Prisma.TransactionClient,
  "category" | "areaSubcategory"
>;

async function ensureCategory(
  client: CategoryCatalogClient,
  householdId: string,
  input: {
    kind: CategoryKind;
    name: string;
    color: string;
    icon: string;
    sortOrder: number;
  },
) {
  const existing = await client.category.findFirst({
    where: {
      householdId,
      kind: input.kind,
      type: TransactionType.EXPENSE,
      name: input.name,
    },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const lastCategory = await client.category.findFirst({
    where: {
      householdId,
      kind: input.kind,
      type: TransactionType.EXPENSE,
    },
    orderBy: [{ sortOrder: "desc" }, { id: "desc" }],
    select: { sortOrder: true },
  });

  const category = await client.category.create({
    data: {
      householdId,
      name: input.name,
      kind: input.kind,
      type: TransactionType.EXPENSE,
      color: input.color,
      icon: input.icon,
      sortOrder: lastCategory ? lastCategory.sortOrder + 1 : input.sortOrder,
    },
    select: { id: true },
  });

  return category.id;
}

export async function ensureDefaultExpenseCategories(
  client: CategoryCatalogClient,
  householdId: string,
) {
  for (const [sortOrder, category] of DEFAULT_AREA_CATEGORY_CATALOG.entries()) {
    const areaCategoryId = await ensureCategory(client, householdId, {
      kind: CategoryKind.AREA,
      name: category.name,
      color: category.color,
      icon: category.icon,
      sortOrder,
    });

    await client.areaSubcategory.createMany({
      data: [...category.subcategories]
        .sort((left, right) => left.localeCompare(right, "pt-BR"))
        .map((name) => ({
          areaCategoryId,
          name,
        })),
      skipDuplicates: true,
    });
  }

  for (const [sortOrder, category] of DEFAULT_PROFILE_CATEGORY_CATALOG.entries()) {
    await ensureCategory(client, householdId, {
      kind: CategoryKind.PROFILE,
      name: category.name,
      color: category.color,
      icon: category.icon,
      sortOrder,
    });
  }
}

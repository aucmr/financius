import { Prisma } from "@/prisma/generated/client";
import { CategoryKind, TransactionType } from "@/prisma/generated/enums";

async function getPrisma() {
  const database = await import("@/src/lib/db/prisma");
  return database.prisma;
}

const categoryManagementSelect = {
  id: true,
  name: true,
  kind: true,
  color: true,
  icon: true,
  sortOrder: true,
  archivedAt: true,
  areaSubcategories: {
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      archivedAt: true,
    },
  },
} satisfies Prisma.CategorySelect;

export type CategoryManagementRecord = Prisma.CategoryGetPayload<{
  select: typeof categoryManagementSelect;
}>;

export type SaveCategoryInput = {
  kind: CategoryKind;
  name: string;
  color: string;
  icon: string;
};

export type MoveCategoryResult = "moved" | "not-found" | "at-boundary";

export async function findCategoriesForManagement(householdId: string) {
  const prisma = await getPrisma();

  return prisma.category.findMany({
    where: { householdId, type: TransactionType.EXPENSE },
    orderBy: [
      { kind: "asc" },
      { sortOrder: "asc" },
      { name: "asc" },
      { id: "asc" },
    ],
    select: categoryManagementSelect,
  });
}

export async function createCategory(
  householdId: string,
  input: SaveCategoryInput,
) {
  const prisma = await getPrisma();
  const lastCategory = await prisma.category.findFirst({
    where: {
      householdId,
      kind: input.kind,
      type: TransactionType.EXPENSE,
    },
    orderBy: [{ sortOrder: "desc" }, { id: "desc" }],
    select: { sortOrder: true },
  });

  return prisma.category.create({
    data: {
      householdId,
      kind: input.kind,
      type: TransactionType.EXPENSE,
      name: input.name,
      color: input.color,
      icon: input.icon,
      sortOrder: (lastCategory?.sortOrder ?? -1) + 1,
    },
    select: { id: true },
  });
}

export async function updateCategory(
  householdId: string,
  categoryId: string,
  input: Omit<SaveCategoryInput, "kind">,
) {
  const prisma = await getPrisma();
  const result = await prisma.category.updateMany({
    where: {
      id: categoryId,
      householdId,
      type: TransactionType.EXPENSE,
      archivedAt: null,
    },
    data: input,
  });

  return result.count > 0;
}

export async function moveCategory(
  householdId: string,
  categoryId: string,
  direction: "up" | "down",
): Promise<MoveCategoryResult> {
  const prisma = await getPrisma();

  return prisma.$transaction(async (transaction) => {
    const current = await transaction.category.findFirst({
      where: {
        id: categoryId,
        householdId,
        type: TransactionType.EXPENSE,
        archivedAt: null,
      },
      select: { id: true, kind: true },
    });

    if (!current) {
      return "not-found";
    }

    const categories = await transaction.category.findMany({
      where: {
        householdId,
        kind: current.kind,
        type: TransactionType.EXPENSE,
        archivedAt: null,
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
        { createdAt: "asc" },
        { id: "asc" },
      ],
      select: { id: true, sortOrder: true },
    });
    const currentIndex = categories.findIndex(
      (category) => category.id === categoryId,
    );
    const targetIndex = currentIndex + (direction === "up" ? -1 : 1);

    if (targetIndex < 0 || targetIndex >= categories.length) {
      return "at-boundary";
    }

    const currentCategory = categories[currentIndex];
    const targetCategory = categories[targetIndex];

    await transaction.category.updateMany({
      where: { id: currentCategory.id, householdId, archivedAt: null },
      data: { sortOrder: targetCategory.sortOrder },
    });
    await transaction.category.updateMany({
      where: { id: targetCategory.id, householdId, archivedAt: null },
      data: { sortOrder: currentCategory.sortOrder },
    });

    return "moved";
  });
}

export async function archiveCategory(householdId: string, categoryId: string) {
  const prisma = await getPrisma();
  const result = await prisma.category.updateMany({
    where: {
      id: categoryId,
      householdId,
      type: TransactionType.EXPENSE,
      archivedAt: null,
    },
    data: { archivedAt: new Date() },
  });

  return result.count > 0;
}

export async function restoreCategory(householdId: string, categoryId: string) {
  const prisma = await getPrisma();
  const result = await prisma.category.updateMany({
    where: {
      id: categoryId,
      householdId,
      type: TransactionType.EXPENSE,
      archivedAt: { not: null },
    },
    data: { archivedAt: null },
  });

  return result.count > 0;
}

export async function createSubcategory(
  householdId: string,
  categoryId: string,
  name: string,
) {
  const prisma = await getPrisma();
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      householdId,
      kind: CategoryKind.AREA,
      type: TransactionType.EXPENSE,
      archivedAt: null,
    },
    select: { id: true },
  });

  if (!category) {
    return null;
  }

  return prisma.areaSubcategory.create({
    data: {
      name,
      areaCategoryId: category.id,
    },
    select: { id: true },
  });
}

export async function updateSubcategory(
  householdId: string,
  categoryId: string,
  subcategoryId: string,
  name: string,
) {
  const prisma = await getPrisma();
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      householdId,
      kind: CategoryKind.AREA,
      type: TransactionType.EXPENSE,
      archivedAt: null,
    },
    select: { id: true },
  });

  if (!category) {
    return false;
  }

  const result = await prisma.areaSubcategory.updateMany({
    where: {
      id: subcategoryId,
      areaCategoryId: category.id,
      archivedAt: null,
    },
    data: { name },
  });

  return result.count > 0;
}

export async function archiveSubcategory(
  householdId: string,
  categoryId: string,
  subcategoryId: string,
) {
  const prisma = await getPrisma();
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      householdId,
      kind: CategoryKind.AREA,
      type: TransactionType.EXPENSE,
      archivedAt: null,
    },
    select: { id: true },
  });

  if (!category) {
    return false;
  }

  const result = await prisma.areaSubcategory.updateMany({
    where: {
      id: subcategoryId,
      areaCategoryId: category.id,
      archivedAt: null,
    },
    data: { archivedAt: new Date() },
  });

  return result.count > 0;
}

export async function restoreSubcategory(
  householdId: string,
  categoryId: string,
  subcategoryId: string,
) {
  const prisma = await getPrisma();
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      householdId,
      kind: CategoryKind.AREA,
      type: TransactionType.EXPENSE,
    },
    select: { id: true },
  });

  if (!category) {
    return false;
  }

  const result = await prisma.areaSubcategory.updateMany({
    where: {
      id: subcategoryId,
      areaCategoryId: category.id,
      archivedAt: { not: null },
    },
    data: { archivedAt: null },
  });

  return result.count > 0;
}

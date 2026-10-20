import { CategoryKind } from "@/prisma/generated/enums";
import type { AuthContext } from "@/src/lib/auth/context";

import {
  archiveCategory as archiveCategoryRecord,
  archiveSubcategory as archiveSubcategoryRecord,
  createCategory as createCategoryRecord,
  createSubcategory as createSubcategoryRecord,
  findCategoriesForManagement,
  moveCategory as moveCategoryRecord,
  restoreCategory as restoreCategoryRecord,
  restoreSubcategory as restoreSubcategoryRecord,
  updateCategory as updateCategoryRecord,
  updateSubcategory as updateSubcategoryRecord,
} from "@/src/app/(app)/categorias/_lib/repository";
import type {
  CategoryFormValues,
  CreateCategoryValues,
  CreateSubcategoryValues,
  UpdateSubcategoryValues,
} from "@/src/app/(app)/categorias/_lib/schemas";
import type { ManagedCategory } from "@/src/app/(app)/categorias/_lib/types";

export class CategoryNotFoundError extends Error {
  constructor() {
    super("A categoria ou subcategoria não foi encontrada.");
    this.name = "CategoryNotFoundError";
  }
}

export class CategoryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CategoryValidationError";
  }
}

export type CategoryRepository = {
  findCategoriesForManagement: typeof findCategoriesForManagement;
  createCategory: typeof createCategoryRecord;
  updateCategory: typeof updateCategoryRecord;
  moveCategory: typeof moveCategoryRecord;
  archiveCategory: typeof archiveCategoryRecord;
  restoreCategory: typeof restoreCategoryRecord;
  createSubcategory: typeof createSubcategoryRecord;
  updateSubcategory: typeof updateSubcategoryRecord;
  archiveSubcategory: typeof archiveSubcategoryRecord;
  restoreSubcategory: typeof restoreSubcategoryRecord;
};

const defaultRepository: CategoryRepository = {
  findCategoriesForManagement,
  createCategory: createCategoryRecord,
  updateCategory: updateCategoryRecord,
  moveCategory: moveCategoryRecord,
  archiveCategory: archiveCategoryRecord,
  restoreCategory: restoreCategoryRecord,
  createSubcategory: createSubcategoryRecord,
  updateSubcategory: updateSubcategoryRecord,
  archiveSubcategory: archiveSubcategoryRecord,
  restoreSubcategory: restoreSubcategoryRecord,
};

function mapCategory(
  category: Awaited<ReturnType<typeof findCategoriesForManagement>>[number],
): ManagedCategory {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    icon: category.icon,
    sortOrder: category.sortOrder,
    archivedAt: category.archivedAt?.toISOString() ?? null,
    subcategories: category.areaSubcategories.map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      archivedAt: subcategory.archivedAt?.toISOString() ?? null,
    })),
  };
}

export async function getCategoriesForManagement(
  context: AuthContext,
  repository: CategoryRepository = defaultRepository,
) {
  const categories = await repository.findCategoriesForManagement(
    context.householdId,
  );

  return {
    householdName: context.householdName,
    areaCategories: categories
      .filter((category) => category.kind === CategoryKind.AREA)
      .map(mapCategory),
    profileCategories: categories
      .filter((category) => category.kind === CategoryKind.PROFILE)
      .map(mapCategory),
  };
}

export async function createCategory(
  context: AuthContext,
  values: CreateCategoryValues,
  repository: CategoryRepository = defaultRepository,
) {
  const name = values.name.trim();

  if (!name) {
    throw new CategoryValidationError("Informe o nome da categoria.");
  }

  return repository.createCategory(context.householdId, {
    kind:
      values.kind === "AREA" ? CategoryKind.AREA : CategoryKind.PROFILE,
    name,
    color: values.color,
    icon: values.icon,
  });
}

export async function updateCategory(
  context: AuthContext,
  categoryId: string,
  values: CategoryFormValues,
  repository: CategoryRepository = defaultRepository,
) {
  const updated = await repository.updateCategory(
    context.householdId,
    categoryId,
    {
      name: values.name.trim(),
      color: values.color,
      icon: values.icon,
    },
  );

  if (!updated) {
    throw new CategoryNotFoundError();
  }
}

export async function moveCategory(
  context: AuthContext,
  categoryId: string,
  direction: "up" | "down",
  repository: CategoryRepository = defaultRepository,
) {
  const result = await repository.moveCategory(
    context.householdId,
    categoryId,
    direction,
  );

  if (result === "not-found") {
    throw new CategoryNotFoundError();
  }

  return result === "moved";
}

export async function archiveCategory(
  context: AuthContext,
  categoryId: string,
  repository: CategoryRepository = defaultRepository,
) {
  const archived = await repository.archiveCategory(
    context.householdId,
    categoryId,
  );

  if (!archived) {
    throw new CategoryNotFoundError();
  }
}

export async function restoreCategory(
  context: AuthContext,
  categoryId: string,
  repository: CategoryRepository = defaultRepository,
) {
  const restored = await repository.restoreCategory(
    context.householdId,
    categoryId,
  );

  if (!restored) {
    throw new CategoryNotFoundError();
  }
}

export async function createSubcategory(
  context: AuthContext,
  values: CreateSubcategoryValues,
  repository: CategoryRepository = defaultRepository,
) {
  const name = values.name.trim();

  if (!name) {
    throw new CategoryValidationError("Informe o nome da subcategoria.");
  }

  const created = await repository.createSubcategory(
    context.householdId,
    values.categoryId,
    name,
  );

  if (!created) {
    throw new CategoryNotFoundError();
  }
}

export async function updateSubcategory(
  context: AuthContext,
  values: UpdateSubcategoryValues,
  repository: CategoryRepository = defaultRepository,
) {
  const updated = await repository.updateSubcategory(
    context.householdId,
    values.categoryId,
    values.subcategoryId,
    values.name.trim(),
  );

  if (!updated) {
    throw new CategoryNotFoundError();
  }
}

export async function archiveSubcategory(
  context: AuthContext,
  categoryId: string,
  subcategoryId: string,
  repository: CategoryRepository = defaultRepository,
) {
  const archived = await repository.archiveSubcategory(
    context.householdId,
    categoryId,
    subcategoryId,
  );

  if (!archived) {
    throw new CategoryNotFoundError();
  }
}

export async function restoreSubcategory(
  context: AuthContext,
  categoryId: string,
  subcategoryId: string,
  repository: CategoryRepository = defaultRepository,
) {
  const restored = await repository.restoreSubcategory(
    context.householdId,
    categoryId,
    subcategoryId,
  );

  if (!restored) {
    throw new CategoryNotFoundError();
  }
}

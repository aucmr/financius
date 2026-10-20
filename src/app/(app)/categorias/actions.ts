"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/prisma/generated/client";
import { z } from "zod";

import {
  HouseholdAccessError,
  UnauthorizedError,
  getAuthContext,
  type AuthContext,
} from "@/src/lib/auth/context";
import {
  archiveCategory,
  archiveSubcategory,
  CategoryNotFoundError,
  CategoryValidationError,
  createCategory,
  createSubcategory,
  moveCategory,
  restoreCategory,
  restoreSubcategory,
  updateCategory,
  updateSubcategory,
} from "@/src/app/(app)/categorias/_lib/services";
import {
  categoryActionSchema,
  createCategorySchema,
  createSubcategorySchema,
  getCategoryFieldErrors,
  moveCategorySchema,
  subcategoryActionSchema,
  updateCategorySchema,
  updateSubcategorySchema,
} from "@/src/app/(app)/categorias/_lib/schemas";

export type CategoryActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

function invalidFormResult(error: z.ZodError): CategoryActionResult {
  const fieldErrors = getCategoryFieldErrors(error);

  return {
    ok: false,
    message: Object.values(fieldErrors)[0] ?? "Confira os dados informados.",
    fieldErrors,
  };
}

function revalidateCategoryPaths() {
  revalidatePath("/categorias");
  revalidatePath("/despesas");
  revalidatePath("/despesas/nova");
  revalidatePath("/despesas/[id]/editar", "page");
  revalidatePath("/despesas/importar");
}

async function runCategoryAction(
  operation: (context: AuthContext) => Promise<string>,
): Promise<CategoryActionResult> {
  try {
    const context = await getAuthContext();
    const message = await operation(context);
    revalidateCategoryPaths();

    return { ok: true, message };
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof HouseholdAccessError ||
      error instanceof CategoryNotFoundError ||
      error instanceof CategoryValidationError
    ) {
      return { ok: false, message: error.message };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        message: "Já existe uma categoria ou subcategoria com esse nome.",
      };
    }

    throw error;
  }
}

export async function createCategoryAction(
  values: unknown,
): Promise<CategoryActionResult> {
  const parsed = createCategorySchema.safeParse(values);

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  return runCategoryAction(async (context) => {
    await createCategory(context, parsed.data);
    return "Categoria criada.";
  });
}

export async function updateCategoryAction(
  values: unknown,
): Promise<CategoryActionResult> {
  const parsed = updateCategorySchema.safeParse(values);

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  return runCategoryAction(async (context) => {
    const { categoryId, ...categoryValues } = parsed.data;
    await updateCategory(context, categoryId, categoryValues);
    return "Categoria atualizada.";
  });
}

export async function moveCategoryAction(
  values: unknown,
): Promise<CategoryActionResult> {
  const parsed = moveCategorySchema.safeParse(values);

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  return runCategoryAction(async (context) => {
    const moved = await moveCategory(
      context,
      parsed.data.categoryId,
      parsed.data.direction,
    );

    return moved
      ? "Ordem das categorias atualizada."
      : parsed.data.direction === "up"
        ? "A categoria já está no início da lista."
        : "A categoria já está no final da lista.";
  });
}

export async function archiveCategoryAction(
  values: unknown,
): Promise<CategoryActionResult> {
  const parsed = categoryActionSchema.safeParse(values);

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  return runCategoryAction(async (context) => {
    await archiveCategory(context, parsed.data.categoryId);
    return "Categoria arquivada. As despesas anteriores foram preservadas.";
  });
}

export async function restoreCategoryAction(
  values: unknown,
): Promise<CategoryActionResult> {
  const parsed = categoryActionSchema.safeParse(values);

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  return runCategoryAction(async (context) => {
    await restoreCategory(context, parsed.data.categoryId);
    return "Categoria restaurada.";
  });
}

export async function createSubcategoryAction(
  values: unknown,
): Promise<CategoryActionResult> {
  const parsed = createSubcategorySchema.safeParse(values);

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  return runCategoryAction(async (context) => {
    await createSubcategory(context, parsed.data);
    return "Subcategoria criada.";
  });
}

export async function updateSubcategoryAction(
  values: unknown,
): Promise<CategoryActionResult> {
  const parsed = updateSubcategorySchema.safeParse(values);

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  return runCategoryAction(async (context) => {
    await updateSubcategory(context, parsed.data);
    return "Subcategoria atualizada.";
  });
}

export async function archiveSubcategoryAction(
  values: unknown,
): Promise<CategoryActionResult> {
  const parsed = subcategoryActionSchema.safeParse(values);

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  return runCategoryAction(async (context) => {
    await archiveSubcategory(
      context,
      parsed.data.categoryId,
      parsed.data.subcategoryId,
    );
    return "Subcategoria arquivada. As despesas anteriores foram preservadas.";
  });
}

export async function restoreSubcategoryAction(
  values: unknown,
): Promise<CategoryActionResult> {
  const parsed = subcategoryActionSchema.safeParse(values);

  if (!parsed.success) {
    return invalidFormResult(parsed.error);
  }

  return runCategoryAction(async (context) => {
    await restoreSubcategory(
      context,
      parsed.data.categoryId,
      parsed.data.subcategoryId,
    );
    return "Subcategoria restaurada.";
  });
}

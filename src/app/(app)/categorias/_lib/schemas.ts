import { z } from "zod";

import { CATEGORY_ICON_NAMES } from "@/src/lib/categories/catalog";

const categoryIdSchema = z
  .string()
  .trim()
  .min(1, "Categoria inválida.");

const subcategoryIdSchema = z
  .string()
  .trim()
  .min(1, "Subcategoria inválida.");

const nameSchema = z
  .string()
  .trim()
  .min(1, "Informe um nome.")
  .max(80, "O nome deve ter no máximo 80 caracteres.");

const categoryAppearanceFields = {
  name: nameSchema,
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Selecione uma cor válida."),
  icon: z.enum(CATEGORY_ICON_NAMES),
};

export const categoryFormSchema = z
  .object(categoryAppearanceFields)
  .strict();

export const subcategoryFormSchema = z
  .object({
    name: nameSchema,
  })
  .strict();

export const createCategorySchema = z
  .object({
    ...categoryAppearanceFields,
    kind: z.enum(["AREA", "PROFILE"]),
  })
  .strict();

export const updateCategorySchema = z
  .object({
    ...categoryAppearanceFields,
    categoryId: categoryIdSchema,
  })
  .strict();

export const createSubcategorySchema = subcategoryFormSchema
  .extend({ categoryId: categoryIdSchema })
  .strict();

export const updateSubcategorySchema = subcategoryFormSchema
  .extend({
    categoryId: categoryIdSchema,
    subcategoryId: subcategoryIdSchema,
  })
  .strict();

export const categoryActionSchema = z
  .object({
    categoryId: categoryIdSchema,
  })
  .strict();

export const subcategoryActionSchema = z
  .object({
    categoryId: categoryIdSchema,
    subcategoryId: subcategoryIdSchema,
  })
  .strict();

export const moveCategorySchema = z
  .object({
    categoryId: categoryIdSchema,
    direction: z.enum(["up", "down"]),
  })
  .strict();

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
export type SubcategoryFormValues = z.infer<typeof subcategoryFormSchema>;
export type CreateCategoryValues = z.infer<typeof createCategorySchema>;
export type CreateSubcategoryValues = z.infer<typeof createSubcategorySchema>;
export type UpdateSubcategoryValues = z.infer<typeof updateSubcategorySchema>;

export function getCategoryFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

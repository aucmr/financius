import { z } from "zod";

import { isValidMonth } from "@/src/lib/utils/date";

const itemIdSchema = z.string().trim().min(1, "Item inválido.");

export const payableItemFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome do item.")
      .max(80, "O nome deve ter no máximo 80 caracteres."),
  })
  .strict();

export const renamePayableItemSchema = z
  .object({
    itemId: itemIdSchema,
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome do item.")
      .max(80, "O nome deve ter no máximo 80 caracteres."),
  })
  .strict();

export const monthlyPayableStatusSchema = z
  .object({
    itemId: itemIdSchema,
    month: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "Mês inválido.")
      .refine(isValidMonth, "Mês inválido."),
    isPaid: z.boolean(),
  })
  .strict();

export const movePayableItemSchema = z
  .object({
    itemId: itemIdSchema,
    direction: z.enum(["up", "down"]),
  })
  .strict();

export const archivePayableItemSchema = z
  .object({
    itemId: itemIdSchema,
  })
  .strict();

export type PayableItemFormValues = z.infer<typeof payableItemFormSchema>;

export function getPayableFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

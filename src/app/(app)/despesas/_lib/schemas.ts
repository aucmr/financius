import { z } from "zod";

import { isValidDateOnly, isValidMonth } from "@/src/lib/utils/date";

const amountPattern = /^(?:0|[1-9]\d{0,7})(?:[.,]\d{1,2})?$/;
const signedAmountPattern = /^-?(?:0|[1-9]\d{0,7})(?:[.,]\d{1,2})?$/;

const expenseFields = {
  description: z.string().trim().min(2, "Informe uma descrição.").max(120),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
    .refine(isValidDateOnly, "Informe uma data válida."),
  areaCategoryId: z.string().min(1, "Selecione uma categoria de área."),
  areaSubcategoryId: z.string().min(1, "Selecione uma subcategoria."),
  profileCategoryId: z.string().min(1, "Selecione uma categoria de perfil."),
  responsibleUserId: z.string().min(1, "Selecione o responsável."),
  notes: z
    .string()
    .trim()
    .max(1000, "As observações devem ter no máximo 1000 caracteres."),
  recurring: z.boolean(),
  shared: z.boolean(),
};

const positiveAmountSchema = z
  .string()
  .trim()
  .regex(
    amountPattern,
    "Informe um valor positivo com até duas casas decimais.",
  )
  .refine(
    (value) => Number(value.replace(",", ".")) > 0,
    "O valor deve ser maior que zero.",
  );

const signedAmountSchema = z
  .string()
  .trim()
  .regex(
    signedAmountPattern,
    "Informe um valor válido com até duas casas decimais.",
  )
  .refine(
    (value) => Number(value.replace(",", ".")) !== 0,
    "O valor não pode ser zero.",
  );

export const expenseFormSchema = z
  .object({
    ...expenseFields,
    amount: positiveAmountSchema,
  })
  .strict();

export const expenseEditFormSchema = z
  .object({
    ...expenseFields,
    amount: signedAmountSchema,
  })
  .strict();

export const expenseIdSchema = z.string().trim().min(1, "Despesa inválida.");

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export function parseExpenseFormInput(
  input: unknown,
  options: { allowNegative?: boolean } = {},
) {
  return (
    options.allowNegative ? expenseEditFormSchema : expenseFormSchema
  ).safeParse(input);
}

export function parseExpenseId(input: unknown) {
  return expenseIdSchema.safeParse(input);
}

export function getFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

export function parseMonthInput(input: unknown) {
  return z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Mês inválido.")
    .refine(isValidMonth, "Mês inválido.")
    .safeParse(input);
}

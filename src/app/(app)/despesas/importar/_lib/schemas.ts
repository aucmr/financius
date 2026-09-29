import { z } from "zod";

import { importSources } from "@/src/lib/imports";
import { isValidDateOnly } from "@/src/lib/utils/date";

const signedAmountPattern = /^-?(?:0|[1-9]\d{0,7})(?:[.,]\d{1,2})?$/;
const fingerprintPattern = /^[a-f0-9]{16,64}$/;

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data valida.")
  .refine(isValidDateOnly, "Informe uma data valida.");

const installmentSchema = z
  .object({
    current: z.number().int().min(1),
    total: z.number().int().min(1),
  })
  .strict()
  .refine((value) => value.current <= value.total, "Parcela invalida.");

export const importSourceSchema = z.enum(importSources);

export const importParseSchema = z
  .object({
    source: importSourceSchema,
    fileName: z.string().trim().min(1).max(255),
    content: z.string().min(1).max(5_000_000),
    statementDate: dateOnlySchema.nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      (value.source === "XP" || value.source === "BTG") &&
      !value.statementDate
    ) {
      context.addIssue({
        code: "custom",
        path: ["statementDate"],
        message: "Informe a competencia da fatura.",
      });
    }
  });

export const importExpenseRowSchema = z
  .object({
    rowNumber: z.number().int().positive(),
    source: importSourceSchema,
    description: z.string().trim().min(2).max(120),
    amount: z
      .string()
      .trim()
      .regex(
        signedAmountPattern,
        "Informe um valor valido com ate duas casas decimais.",
      )
      .refine(
        (value) => Number(value.replace(",", ".")) !== 0,
        "O valor nao pode ser zero.",
      ),
    transactionDate: dateOnlySchema,
    cardholder: z.string().trim().max(120).nullable(),
    installment: installmentSchema.nullable(),
    authorizationCode: z.string().trim().max(80).nullable(),
    documentNumber: z.string().trim().max(80).nullable(),
    metadata: z.record(z.string(), z.string().nullable()),
    areaCategoryId: z.string().trim().min(1),
    areaSubcategoryId: z.string().trim().min(1),
    profileCategoryId: z.string().trim().min(1),
    responsibleUserId: z.string().trim().min(1),
    notes: z.string().trim().max(1000),
    shared: z.boolean(),
    recurring: z.boolean(),
    allowDuplicateImport: z.boolean(),
  })
  .strict();

export const importRowIdentitySchema = importExpenseRowSchema
  .pick({
    rowNumber: true,
    source: true,
    description: true,
    amount: true,
    transactionDate: true,
    cardholder: true,
    installment: true,
    authorizationCode: true,
    documentNumber: true,
    metadata: true,
  })
  .strict();

export const importBatchSchema = z
  .object({
    source: importSourceSchema,
    fileName: z.string().trim().min(1).max(255),
    fileFingerprint: z.string().regex(fingerprintPattern, "Arquivo invalido."),
    statementDate: dateOnlySchema.nullable(),
    totalRows: z.number().int().nonnegative().max(10000),
    ignoredRows: z.number().int().nonnegative().max(10000),
    skippedRows: z.number().int().nonnegative().max(10000),
    rows: z.array(importExpenseRowSchema).max(10000),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      (value.source === "XP" || value.source === "BTG") &&
      !value.statementDate
    ) {
      context.addIssue({
        code: "custom",
        path: ["statementDate"],
        message: "Informe a competencia da fatura.",
      });
    }

    if (value.rows.some((row) => row.source !== value.source)) {
      context.addIssue({
        code: "custom",
        path: ["rows"],
        message: "As linhas nao pertencem ao formato selecionado.",
      });
    }

    if (new Set(value.rows.map((row) => row.responsibleUserId)).size > 1) {
      context.addIssue({
        code: "custom",
        path: ["rows"],
        message: "O arquivo deve usar um unico responsavel.",
      });
    }
  });

export type ImportExpenseRowInput = z.infer<typeof importExpenseRowSchema>;
export type ImportRowIdentityInput = z.infer<typeof importRowIdentitySchema>;
export type ImportBatchInput = z.infer<typeof importBatchSchema>;
export type ImportParseInput = z.infer<typeof importParseSchema>;

export function getImportFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}

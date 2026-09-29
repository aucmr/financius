import { describe, expect, it } from "vitest";

import {
  importBatchSchema,
  importExpenseRowSchema,
} from "@/src/app/(app)/despesas/importar/_lib/schemas";

const validRow = {
  rowNumber: 2,
  source: "XP" as const,
  description: "Estorno loja",
  amount: "-45.93",
  transactionDate: "2026-06-10",
  cardholder: "Pessoa 1",
  installment: null,
  authorizationCode: null,
  documentNumber: null,
  metadata: {},
  areaCategoryId: "area-id",
  areaSubcategoryId: "subcategory-id",
  profileCategoryId: "profile-id",
  responsibleUserId: "member-id",
  notes: "",
  shared: true,
  recurring: false,
  allowDuplicateImport: false,
};

describe("import schemas", () => {
  it("accepts signed non-zero amounts for imported expenses", () => {
    expect(importExpenseRowSchema.safeParse(validRow).success).toBe(true);
    expect(
      importExpenseRowSchema.safeParse({ ...validRow, amount: "0.00" }).success,
    ).toBe(false);
  });

  it("rejects server-owned fields", () => {
    expect(
      importExpenseRowSchema.safeParse({ ...validRow, householdId: "forged" })
        .success,
    ).toBe(false);
  });

  it("requires a statement date for card batches but not BB", () => {
    const base = {
      source: "XP" as const,
      fileName: "fatura.csv",
      fileFingerprint: "a".repeat(64),
      statementDate: null,
      totalRows: 1,
      ignoredRows: 0,
      skippedRows: 0,
      rows: [validRow],
    };

    expect(importBatchSchema.safeParse(base).success).toBe(false);
    expect(
      importBatchSchema.safeParse({
        ...base,
        source: "BB",
        rows: [{ ...validRow, source: "BB" }],
      }).success,
    ).toBe(true);
  });

  it("requires one responsible user for the whole batch", () => {
    expect(
      importBatchSchema.safeParse({
        source: "BB",
        fileName: "extrato.csv",
        fileFingerprint: "b".repeat(64),
        statementDate: null,
        totalRows: 2,
        ignoredRows: 0,
        skippedRows: 0,
        rows: [
          { ...validRow, source: "BB", responsibleUserId: "member-a" },
          {
            ...validRow,
            source: "BB",
            rowNumber: 3,
            responsibleUserId: "member-b",
          },
        ],
      }).success,
    ).toBe(false);
  });
});

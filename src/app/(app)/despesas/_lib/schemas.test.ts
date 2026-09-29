import { describe, expect, it } from "vitest";

import {
  expenseEditFormSchema,
  expenseFormSchema,
} from "@/src/app/(app)/despesas/_lib/schemas";

const validExpense = {
  description: "Mercado da semana",
  amount: "123,45",
  date: "2026-09-10",
  areaCategoryId: "area-id",
  areaSubcategoryId: "subcategory-id",
  profileCategoryId: "profile-id",
  responsibleUserId: "user-id",
  notes: "Compra principal do mês",
  recurring: false,
  shared: true,
};

describe("expense form schema", () => {
  it("accepts the editable expense fields", () => {
    expect(expenseFormSchema.safeParse(validExpense).success).toBe(true);
  });

  it("rejects fields reserved for the server or future import", () => {
    const result = expenseFormSchema.safeParse({
      ...validExpense,
      userId: "forged-user",
      creditCardTransactionDate: "2026-09-15",
    });

    expect(result.success).toBe(false);
  });

  it.each([["0,00"], ["12,345"], ["2026-02-29"]])("rejects %s", (value) => {
    const input = { ...validExpense };

    if (value.startsWith("2026-")) {
      input.date = value;
    } else {
      input.amount = value;
    }

    expect(expenseFormSchema.safeParse(input).success).toBe(false);
  });

  it("accepts signed amounts only when editing", () => {
    expect(
      expenseFormSchema.safeParse({ ...validExpense, amount: "-12,50" })
        .success,
    ).toBe(false);
    expect(
      expenseEditFormSchema.safeParse({ ...validExpense, amount: "-12,50" })
        .success,
    ).toBe(true);
    expect(
      expenseEditFormSchema.safeParse({ ...validExpense, amount: "0" }).success,
    ).toBe(false);
  });
});

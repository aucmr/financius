import { describe, expect, it, vi } from "vitest";

import type { AuthContext } from "@/src/lib/auth/context";
import {
  createExpense,
  deleteExpense,
  getExpenseMonthTotals,
  updateExpense,
} from "@/src/app/(app)/despesas/_lib/services";
import type { ExpenseFormValues } from "@/src/app/(app)/despesas/_lib/schemas";
import type { ExpenseRecord } from "@/src/app/(app)/despesas/_lib/repository";

const context: AuthContext = {
  userId: "creator-id",
  householdId: "household-id",
  householdName: "Casa",
  members: [
    { id: "creator-id", name: "Pessoa 1", email: "one@example.com" },
    { id: "member-id", name: "Pessoa 2", email: "two@example.com" },
  ],
};

const values: ExpenseFormValues = {
  description: "Mercado",
  amount: "100,50",
  date: "2026-09-10",
  areaCategoryId: "area-id",
  areaSubcategoryId: "subcategory-id",
  profileCategoryId: "profile-id",
  responsibleUserId: "member-id",
  notes: "",
  recurring: false,
  shared: true,
};

function createRepository() {
  return {
    findExpenseReferences: vi.fn().mockResolvedValue({
      areaCategory: { id: "area-id" },
      areaSubcategory: { id: "subcategory-id" },
      profileCategory: { id: "profile-id" },
      responsibleMember: { userId: "member-id" },
    }),
    createExpense: vi.fn().mockResolvedValue({ id: "new-expense-id" }),
    updateExpense: vi.fn().mockResolvedValue({ id: "expense-id" }),
    deleteExpense: vi.fn().mockResolvedValue(true),
    findExpenseForEdit: vi.fn(),
    findExpenses: vi.fn(),
  };
}

describe("expense service", () => {
  it("derives the creator and household from context", async () => {
    const repository = createRepository();

    await createExpense(context, values, repository);

    expect(repository.createExpense).toHaveBeenCalledWith({
      householdId: "household-id",
      userId: "creator-id",
      description: "Mercado",
      amount: "100.50",
      date: new Date("2026-09-10T00:00:00.000Z"),
      areaCategoryId: "area-id",
      areaSubcategoryId: "subcategory-id",
      profileCategoryId: "profile-id",
      responsibleUserId: "member-id",
      notes: null,
      recurring: false,
      shared: true,
    });
  });

  it("rejects a responsible user outside the household", async () => {
    const repository = createRepository();
    repository.findExpenseReferences.mockResolvedValue({
      areaCategory: { id: "area-id" },
      areaSubcategory: { id: "subcategory-id" },
      profileCategory: { id: "profile-id" },
      responsibleMember: null,
    });

    await expect(createExpense(context, values, repository)).rejects.toThrow(
      "O responsável precisa ser membro do mesmo household.",
    );
    expect(repository.createExpense).not.toHaveBeenCalled();
  });

  it("updates and deletes only through the household-scoped repository", async () => {
    const repository = createRepository();

    await updateExpense(context, "expense-id", values, repository);
    await deleteExpense(context, "expense-id", repository);

    expect(repository.updateExpense).toHaveBeenCalledWith(
      "household-id",
      "expense-id",
      expect.objectContaining({ amount: "100.50" }),
    );
    expect(repository.deleteExpense).toHaveBeenCalledWith(
      "household-id",
      "expense-id",
    );
  });

  it("calculates total and shared total without leaking Prisma Decimal values", () => {
    const records = [
      { amount: { toString: () => "10.25" }, shared: true },
      { amount: { toString: () => "4.75" }, shared: false },
    ] as ExpenseRecord[];

    expect(getExpenseMonthTotals(records)).toEqual({
      total: 15,
      shared: 10.25,
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthContext: vi.fn(),
  findExpenseOptions: vi.fn(),
  getExpenseForEdit: vi.fn(),
  getExpensesForMonth: vi.fn(),
  findImportedStatementBatches: vi.fn(),
}));

vi.mock("@/src/lib/auth/context", () => ({
  getAuthContext: mocks.getAuthContext,
}));

vi.mock("@/src/app/(app)/despesas/_lib/repository", () => ({
  findExpenseOptions: mocks.findExpenseOptions,
}));

vi.mock("@/src/app/(app)/despesas/_lib/services", () => ({
  getExpenseForEdit: mocks.getExpenseForEdit,
  getExpensesForMonth: mocks.getExpensesForMonth,
}));

vi.mock("@/src/app/(app)/despesas/importar/_lib/repository", () => ({
  findImportedStatementBatches: mocks.findImportedStatementBatches,
}));

import { getExpensePageData } from "@/src/app/(app)/despesas/queries";

describe("expense page queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthContext.mockResolvedValue({
      userId: "user-1",
      householdId: "household-1",
      householdName: "Casa",
    });
    mocks.findExpenseOptions.mockResolvedValue({
      areaCategories: [],
      profileCategories: [],
      members: [],
    });
    mocks.getExpensesForMonth.mockResolvedValue({
      expenses: [],
      totals: { total: 0, shared: 0 },
    });
    mocks.findImportedStatementBatches.mockResolvedValue([
      { source: "XP" },
      { source: "BB" },
    ]);
  });

  it("reports imported sources for the selected household and month", async () => {
    const data = await getExpensePageData("2026-08");

    expect(data.importedStatements).toEqual({
      XP: true,
      BTG: false,
      BB: true,
    });
    expect(mocks.findImportedStatementBatches).toHaveBeenCalledWith(
      "household-1",
      new Date("2026-08-01T00:00:00.000Z"),
      new Date("2026-09-01T00:00:00.000Z"),
    );
  });
});

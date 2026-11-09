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

  it("summarizes expenses by area and profile for the selected month", async () => {
    mocks.getExpensesForMonth.mockResolvedValue({
      expenses: [
        {
          amount: "10.10",
          areaCategory: { id: "area-home", name: "Casa", color: "#123456" },
          profileCategory: {
            id: "profile-shared",
            name: "Casal",
            color: "#654321",
          },
        },
        {
          amount: "20.25",
          areaCategory: { id: "area-leisure", name: "Lazer", color: "#234567" },
          profileCategory: {
            id: "profile-ana",
            name: "Ana",
            color: "#765432",
          },
        },
        {
          amount: "0.15",
          areaCategory: { id: "area-home", name: "Casa", color: "#123456" },
          profileCategory: {
            id: "profile-shared",
            name: "Casal",
            color: "#654321",
          },
        },
        {
          amount: "2.50",
          areaCategory: { id: "area-leisure", name: "Lazer", color: "#234567" },
          profileCategory: {
            id: "profile-shared",
            name: "Casal",
            color: "#654321",
          },
        },
      ],
      totals: { total: 33, shared: 12.75 },
    });

    const data = await getExpensePageData("2026-08");

    expect(data.expenseDistribution).toEqual({
      byArea: [
        {
          id: "area-leisure",
          name: "Lazer",
          color: "#234567",
          amount: 22.75,
        },
        {
          id: "area-home",
          name: "Casa",
          color: "#123456",
          amount: 10.25,
        },
      ],
      byProfile: [
        {
          id: "profile-ana",
          name: "Ana",
          color: "#765432",
          amount: 20.25,
        },
        {
          id: "profile-shared",
          name: "Casal",
          color: "#654321",
          amount: 12.75,
        },
      ],
    });
  });
});

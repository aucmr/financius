import { CategoryKind, TransactionType } from "@/prisma/generated/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  $transaction: vi.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
  category: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  areaSubcategory: {
    findFirst: vi.fn(),
  },
  householdMember: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  expense: {
    findFirst: vi.fn(),
  },
}));

vi.mock("@/src/lib/db/prisma", () => ({ prisma }));

import {
  findExpenseOptions,
  findExpenseReferences,
} from "@/src/app/(app)/despesas/_lib/repository";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("expense category repository", () => {
  it("loads active household categories in their saved order", async () => {
    prisma.category.findMany
      .mockResolvedValueOnce([
        {
          id: "area-home",
          name: "Moradia",
          color: "#2f855a",
          icon: "home",
          sortOrder: 0,
          areaSubcategories: [],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "profile-fixed",
          name: "Fixo",
          color: "#0000ff",
          icon: "wallet",
          sortOrder: 0,
        },
      ]);
    prisma.householdMember.findMany.mockResolvedValueOnce([
      { user: { id: "user-1", name: "Ana", email: "ana@example.com" } },
    ]);

    await expect(findExpenseOptions("household-1")).resolves.toMatchObject({
      areaCategories: [{ id: "area-home", sortOrder: 0 }],
      profileCategories: [{ id: "profile-fixed", sortOrder: 0 }],
      members: [{ id: "user-1", name: "Ana" }],
    });

    expect(prisma.category.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          householdId: "household-1",
          kind: CategoryKind.AREA,
          type: TransactionType.EXPENSE,
          archivedAt: null,
        },
        orderBy: [
          { sortOrder: "asc" },
          { name: "asc" },
          { id: "asc" },
        ],
        select: expect.objectContaining({
          areaSubcategories: expect.objectContaining({
            where: { archivedAt: null },
          }),
        }),
      }),
    );
    expect(prisma.category.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          householdId: "household-1",
          kind: CategoryKind.PROFILE,
          type: TransactionType.EXPENSE,
          archivedAt: null,
        },
        orderBy: [
          { sortOrder: "asc" },
          { name: "asc" },
          { id: "asc" },
        ],
      }),
    );
  });

  it("validates both expense categories and subcategories against the household", async () => {
    prisma.category.findFirst
      .mockResolvedValueOnce({ id: "area-home" })
      .mockResolvedValueOnce({ id: "profile-fixed" });
    prisma.areaSubcategory.findFirst.mockResolvedValueOnce({
      id: "subcategory-bills",
    });
    prisma.householdMember.findFirst.mockResolvedValueOnce({
      userId: "user-1",
    });

    await findExpenseReferences("household-1", {
      areaCategoryId: "area-home",
      areaSubcategoryId: "subcategory-bills",
      profileCategoryId: "profile-fixed",
      responsibleUserId: "user-1",
    });

    expect(prisma.category.findFirst).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          id: "area-home",
          householdId: "household-1",
          kind: CategoryKind.AREA,
          archivedAt: null,
        }),
      }),
    );
    expect(prisma.areaSubcategory.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "subcategory-bills",
          areaCategoryId: "area-home",
          archivedAt: null,
          areaCategory: {
            is: {
              householdId: "household-1",
              kind: CategoryKind.AREA,
              type: TransactionType.EXPENSE,
              archivedAt: null,
            },
          },
        },
      }),
    );
    expect(prisma.category.findFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          id: "profile-fixed",
          householdId: "household-1",
          kind: CategoryKind.PROFILE,
          archivedAt: null,
        }),
      }),
    );
  });

  it("includes only the current expense's archived categories when editing", async () => {
    prisma.category.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    prisma.householdMember.findMany.mockResolvedValueOnce([]);

    await findExpenseOptions("household-1", {
      areaCategoryId: "area-archived",
      areaSubcategoryId: "subcategory-archived",
      profileCategoryId: "profile-archived",
    });

    expect(prisma.category.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          householdId: "household-1",
          OR: [{ archivedAt: null }, { id: "area-archived" }],
        }),
        select: expect.objectContaining({
          areaSubcategories: expect.objectContaining({
            where: {
              OR: [
                { archivedAt: null },
                { id: "subcategory-archived" },
              ],
            },
          }),
        }),
      }),
    );
    expect(prisma.category.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          householdId: "household-1",
          OR: [{ archivedAt: null }, { id: "profile-archived" }],
        }),
      }),
    );
  });

  it("allows retaining archived references from the same household expense", async () => {
    prisma.expense.findFirst.mockResolvedValueOnce({
      areaCategoryId: "area-archived",
      areaSubcategoryId: "subcategory-archived",
      profileCategoryId: "profile-archived",
    });
    prisma.category.findFirst
      .mockResolvedValueOnce({ id: "area-archived" })
      .mockResolvedValueOnce({ id: "profile-archived" });
    prisma.areaSubcategory.findFirst.mockResolvedValueOnce({
      id: "subcategory-archived",
    });
    prisma.householdMember.findFirst.mockResolvedValueOnce({
      userId: "user-1",
    });

    await findExpenseReferences(
      "household-1",
      {
        areaCategoryId: "area-archived",
        areaSubcategoryId: "subcategory-archived",
        profileCategoryId: "profile-archived",
        responsibleUserId: "user-1",
      },
      "expense-1",
    );

    expect(prisma.expense.findFirst).toHaveBeenCalledWith({
      where: { id: "expense-1", householdId: "household-1" },
      select: {
        areaCategoryId: true,
        areaSubcategoryId: true,
        profileCategoryId: true,
      },
    });
    expect(prisma.category.findFirst.mock.calls[0][0].where).not.toHaveProperty(
      "archivedAt",
    );
    expect(
      prisma.areaSubcategory.findFirst.mock.calls[0][0].where,
    ).not.toHaveProperty("archivedAt");
    expect(prisma.category.findFirst.mock.calls[1][0].where).not.toHaveProperty(
      "archivedAt",
    );
  });
});

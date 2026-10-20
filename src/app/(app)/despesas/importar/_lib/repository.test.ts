import { CategoryKind, TransactionType } from "@/prisma/generated/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  expense: {
    findMany: vi.fn(),
  },
}));

vi.mock("@/src/lib/db/prisma", () => ({ prisma }));

import { findImportSuggestionCandidates } from "@/src/app/(app)/despesas/importar/_lib/repository";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("import suggestion repository", () => {
  it("suggests only active categories belonging to the current household", async () => {
    prisma.expense.findMany.mockResolvedValueOnce([]);

    await findImportSuggestionCandidates("household-1");

    expect(prisma.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          householdId: "household-1",
          areaCategory: {
            is: {
              householdId: "household-1",
              kind: CategoryKind.AREA,
              type: TransactionType.EXPENSE,
              archivedAt: null,
            },
          },
          areaSubcategory: {
            is: {
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
          },
          profileCategory: {
            is: {
              householdId: "household-1",
              kind: CategoryKind.PROFILE,
              type: TransactionType.EXPENSE,
              archivedAt: null,
            },
          },
        },
      }),
    );
  });
});

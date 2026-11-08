import { CategoryKind, TransactionType } from "@/prisma/generated/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  expense: {
    findMany: vi.fn(),
  },
  importBatch: {
    findMany: vi.fn(),
  },
}));

vi.mock("@/src/lib/db/prisma", () => ({ prisma }));

import {
  findImportSuggestionCandidates,
  findImportedStatementBatches,
} from "@/src/app/(app)/despesas/importar/_lib/repository";

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

  it("finds successful monthly batches and legacy BB batches by transaction date", async () => {
    const start = new Date("2026-08-01T00:00:00.000Z");
    const end = new Date("2026-09-01T00:00:00.000Z");
    prisma.importBatch.findMany.mockResolvedValueOnce([]);

    await findImportedStatementBatches("household-1", start, end);

    expect(prisma.importBatch.findMany).toHaveBeenCalledWith({
      where: {
        householdId: "household-1",
        status: { in: ["COMPLETED", "PARTIAL"] },
        importedRows: { gt: 0 },
        OR: [
          { statementDate: { gte: start, lt: end } },
          {
            source: "BB",
            statementDate: null,
            expenses: { some: { date: { gte: start, lt: end } } },
          },
        ],
      },
      select: { source: true },
    });
  });
});

import { Prisma } from "@/prisma/generated/client";

import {
  findExpenseOptions,
  findExpenseReferences,
} from "@/src/app/(app)/despesas/_lib/repository";
import type { ImportSource } from "@/src/lib/imports";

async function getPrisma() {
  const database = await import("@/src/lib/db/prisma");
  return database.prisma;
}

export { findExpenseOptions, findExpenseReferences };

export type ImportSuggestionCandidate = {
  description: string;
  notes: string | null;
  importBatchId: string | null;
  importMetadata: Prisma.JsonValue | null;
  areaCategoryId: string;
  areaCategoryName: string;
  areaSubcategoryId: string;
  areaSubcategoryName: string;
  profileCategoryId: string;
  profileCategoryName: string;
};

export async function findImportSuggestionCandidates(householdId: string) {
  const prisma = await getPrisma();
  return prisma.expense.findMany({
    where: { householdId },
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: {
      description: true,
      notes: true,
      importBatchId: true,
      importMetadata: true,
      areaCategory: { select: { id: true, name: true } },
      areaSubcategory: { select: { id: true, name: true } },
      profileCategory: { select: { id: true, name: true } },
    },
  });
}

export type ImportDuplicateCandidate = {
  id: string;
  description: string;
  amount: Prisma.Decimal;
  date: Date;
  creditCardTransactionDate: Date | null;
  importFingerprint: string | null;
  importBatch: { source: ImportSource; fileName: string } | null;
};

export async function findImportDuplicateCandidates(input: {
  householdId: string;
  amount: string;
  transactionDate: Date;
  statementDate: Date | null;
  importFingerprint: string;
}) {
  const prisma = await getPrisma();
  const dates = [input.transactionDate];
  if (input.statementDate) {
    dates.push(input.statementDate);
  }

  return prisma.expense.findMany({
    where: {
      householdId: input.householdId,
      amount: input.amount,
      OR: [
        { importFingerprint: input.importFingerprint },
        ...dates.map((date) => ({ date })),
        ...dates.map((date) => ({ creditCardTransactionDate: date })),
      ],
    },
    orderBy: { date: "desc" },
    take: 50,
    select: {
      id: true,
      description: true,
      amount: true,
      date: true,
      creditCardTransactionDate: true,
      importFingerprint: true,
      importBatch: { select: { source: true, fileName: true } },
    },
  });
}

export type PersistImportedExpense = {
  householdId: string;
  description: string;
  amount: string;
  date: Date;
  creditCardTransactionDate: Date | null;
  areaCategoryId: string;
  areaSubcategoryId: string;
  profileCategoryId: string;
  userId: string;
  responsibleUserId: string;
  notes: string | null;
  recurring: boolean;
  shared: boolean;
  importFingerprint: string;
  importRowNumber: number;
  importMetadata: Record<string, string | null>;
};

export type CreateImportBatchInput = {
  householdId: string;
  userId: string;
  source: ImportSource;
  fileName: string;
  fileFingerprint: string;
  statementDate: Date | null;
  status: "COMPLETED" | "PARTIAL" | "FAILED";
  totalRows: number;
  importedRows: number;
  ignoredRows: number;
  skippedRows: number;
  failedRows: number;
  expenses: PersistImportedExpense[];
};

export async function createImportBatch(input: CreateImportBatchInput) {
  const prisma = await getPrisma();

  return prisma.$transaction(async (transaction) => {
    const batch = await transaction.importBatch.create({
      data: {
        householdId: input.householdId,
        userId: input.userId,
        source: input.source,
        fileName: input.fileName,
        fileFingerprint: input.fileFingerprint,
        statementDate: input.statementDate,
        status: input.status,
        totalRows: input.totalRows,
        importedRows: input.importedRows,
        ignoredRows: input.ignoredRows,
        skippedRows: input.skippedRows,
        failedRows: input.failedRows,
      },
      select: { id: true },
    });

    for (const expense of input.expenses) {
      await transaction.expense.create({
        data: {
          ...expense,
          importBatchId: batch.id,
        },
        select: { id: true },
      });
    }

    return batch;
  });
}

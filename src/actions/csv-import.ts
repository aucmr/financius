"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  extractExpensesFromCSV,
  type CSVBank,
  type ParsedExpenseRow,
} from "@/lib/csv-parser";
import {
  expenseFormSchema,
  type ExpenseFormValues,
} from "@/lib/validations/expense";

export type ImportExpenseData = {
  description: string;
  amount: number;
  date: string;
  areaCategoryId: string;
  profileCategoryId: string;
  responsibleUserId: string;
  notes?: string;
  shared?: boolean;
  recurring?: boolean;
};

async function getCurrentUserId() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    throw new Error("Unauthenticated");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    throw new Error("Authenticated user was not found");
  }

  return user.id;
}

export async function parseCSVImport(
  csvContent: string,
  bank: CSVBank,
): Promise<ParsedExpenseRow[]> {
  try {
    const expenses = extractExpensesFromCSV(csvContent, bank);
    return expenses;
  } catch (error) {
    throw new Error(
      `Failed to parse CSV: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function detectBankFormat(
  csvContent: string,
): Promise<CSVBank | null> {
  try {
    const { parseCSV, detectBankFormat: detectBank } =
      await import("@/lib/csv-parser");
    const records = parseCSV(csvContent);
    if (records.length === 0) return null;
    return detectBank(records[0]);
  } catch {
    return null;
  }
}

export async function createBatchExpenses(
  expenses: ImportExpenseData[],
): Promise<{ success: number; failed: number; errors: string[] }> {
  const userId = await getCurrentUserId();

  let successCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < expenses.length; i++) {
    try {
      const data = expenses[i];

      // Validate using the expense form schema
      const parsed = expenseFormSchema.parse({
        description: data.description,
        amount: data.amount,
        date: data.date,
        areaCategoryId: data.areaCategoryId,
        profileCategoryId: data.profileCategoryId,
        responsibleUserId: data.responsibleUserId,
        notes: data.notes || "",
        shared: data.shared || false,
        recurring: data.recurring || false,
      });

      const date = new Date(parsed.date);

      // Verify categories exist
      const [areaCategory, profileCategory, responsibleUser] =
        await Promise.all([
          prisma.category.findFirst({
            where: {
              id: parsed.areaCategoryId,
              kind: "AREA",
              type: "EXPENSE",
            },
            select: { id: true },
          }),
          prisma.category.findFirst({
            where: {
              id: parsed.profileCategoryId,
              kind: "PROFILE",
              type: "EXPENSE",
            },
            select: { id: true },
          }),
          prisma.user.findUnique({
            where: { id: parsed.responsibleUserId },
            select: { id: true },
          }),
        ]);

      if (!areaCategory) {
        throw new Error("Invalid AREA category");
      }

      if (!profileCategory) {
        throw new Error("Invalid PROFILE category");
      }

      if (!responsibleUser) {
        throw new Error("Invalid responsible user");
      }

      // Create expense
      await prisma.expense.create({
        data: {
          description: parsed.description,
          amount: parsed.amount.toFixed(2),
          date,
          areaCategoryId: areaCategory.id,
          profileCategoryId: profileCategory.id,
          userId,
          responsibleUserId: responsibleUser.id,
          notes: parsed.notes?.trim() || null,
          recurring: parsed.recurring,
          shared: parsed.shared,
        },
      });

      successCount++;
    } catch (error) {
      errors.push(
        `Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return {
    success: successCount,
    failed: expenses.length - successCount,
    errors,
  };
}

export async function getAllUsers() {
  await getCurrentUserId();

  return prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getCategories() {
  await getCurrentUserId();

  const [areaCategories, profileCategories] = await Promise.all([
    prisma.category.findMany({
      where: { kind: "AREA", type: "EXPENSE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { kind: "PROFILE", type: "EXPENSE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { areaCategories, profileCategories };
}

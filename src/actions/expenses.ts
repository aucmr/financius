"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  expenseFormSchema,
  type ExpenseFormValues,
} from "@/lib/validations/expense";

export type CreateExpenseInput = ExpenseFormValues;

export async function createExpenseForUser(
  userId: string,
  input: CreateExpenseInput,
) {
  const parsed = expenseFormSchema.parse(input);
  const date = new Date(parsed.date);

  const [areaCategory, profileCategory, responsibleUser] = await Promise.all([
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

  return prisma.expense.create({
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
}

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

export async function createExpense(input: CreateExpenseInput) {
  const userId = await getCurrentUserId();
  return createExpenseForUser(userId, input);
}

export async function getExpenses() {
  await getCurrentUserId();

  return prisma.expense.findMany({
    include: {
      user: { select: { name: true } },
      responsibleUser: { select: { name: true } },
      areaCategory: { select: { name: true } },
      profileCategory: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });
}

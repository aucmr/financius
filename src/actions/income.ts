"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  incomeFormSchema,
  type IncomeFormValues,
} from "@/lib/validations/income";

export type CreateIncomeInput = IncomeFormValues;

export async function createIncomeForUser(
  userId: string,
  input: CreateIncomeInput,
) {
  const parsed = incomeFormSchema.parse(input);
  const date = new Date(parsed.date);

  const ownerUser = await prisma.user.findUnique({
    where: { id: parsed.ownerUserId },
    select: { id: true },
  });

  if (!ownerUser) {
    throw new Error("Invalid owner user");
  }

  return prisma.income.create({
    data: {
      description: parsed.description,
      amount: parsed.amount.toFixed(2),
      date,
      userId,
      ownerUserId: ownerUser.id,
      notes: parsed.notes?.trim() || null,
      recurring: parsed.recurring,
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

export async function createIncome(input: CreateIncomeInput) {
  const userId = await getCurrentUserId();
  return createIncomeForUser(userId, input);
}

export async function getIncome() {
  await getCurrentUserId();

  return prisma.income.findMany({
    include: {
      user: { select: { name: true } },
      ownerUser: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });
}

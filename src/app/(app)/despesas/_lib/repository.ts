import { Prisma } from "@/prisma/generated/client";
import { CategoryKind, TransactionType } from "@/prisma/generated/enums";

async function getPrisma() {
  const database = await import("@/src/lib/db/prisma");
  return database.prisma;
}

const expenseSelect = {
  id: true,
  description: true,
  amount: true,
  creditCardTransactionDate: true,
  date: true,
  notes: true,
  recurring: true,
  shared: true,
  areaCategory: {
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
    },
  },
  areaSubcategory: {
    select: {
      id: true,
      name: true,
    },
  },
  profileCategory: {
    select: {
      id: true,
      name: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
    },
  },
  responsibleUser: {
    select: {
      id: true,
      name: true,
    },
  },
  importBatch: {
    select: {
      source: true,
      fileName: true,
    },
  },
} as const;

export type ExpenseRecord = Prisma.ExpenseGetPayload<{
  select: typeof expenseSelect;
}>;

export type ExpenseOptionsRecord = Awaited<
  ReturnType<typeof findExpenseOptions>
>;

export type ExpenseReferenceRecord = Awaited<
  ReturnType<typeof findExpenseReferences>
>;

export type PersistExpenseInput = {
  householdId: string;
  userId: string;
  description: string;
  amount: string;
  date: Date;
  areaCategoryId: string;
  areaSubcategoryId: string;
  profileCategoryId: string;
  responsibleUserId: string;
  notes: string | null;
  recurring: boolean;
  shared: boolean;
};

export async function findExpenseOptions(householdId: string) {
  const prisma = await getPrisma();
  const [areaCategories, profileCategories, members] =
    await prisma.$transaction([
      prisma.category.findMany({
        where: {
          kind: CategoryKind.AREA,
          type: TransactionType.EXPENSE,
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
          areaSubcategories: {
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          },
        },
      }),
      prisma.category.findMany({
        where: {
          kind: CategoryKind.PROFILE,
          type: TransactionType.EXPENSE,
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
        },
      }),
      prisma.householdMember.findMany({
        where: { householdId },
        orderBy: { createdAt: "asc" },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

  return {
    areaCategories,
    profileCategories,
    members: members.map(({ user }) => user),
  };
}

export async function findExpenseReferences(
  householdId: string,
  input: Pick<
    PersistExpenseInput,
    | "areaCategoryId"
    | "areaSubcategoryId"
    | "profileCategoryId"
    | "responsibleUserId"
  >,
) {
  const prisma = await getPrisma();
  const [areaCategory, areaSubcategory, profileCategory, responsibleMember] =
    await prisma.$transaction([
      prisma.category.findFirst({
        where: {
          id: input.areaCategoryId,
          kind: CategoryKind.AREA,
          type: TransactionType.EXPENSE,
        },
        select: { id: true },
      }),
      prisma.areaSubcategory.findFirst({
        where: {
          id: input.areaSubcategoryId,
          areaCategoryId: input.areaCategoryId,
        },
        select: { id: true },
      }),
      prisma.category.findFirst({
        where: {
          id: input.profileCategoryId,
          kind: CategoryKind.PROFILE,
          type: TransactionType.EXPENSE,
        },
        select: { id: true },
      }),
      prisma.householdMember.findFirst({
        where: {
          householdId,
          userId: input.responsibleUserId,
        },
        select: { userId: true },
      }),
    ]);

  return { areaCategory, areaSubcategory, profileCategory, responsibleMember };
}

export async function findExpenses(
  householdId: string,
  start: Date,
  end: Date,
) {
  const prisma = await getPrisma();
  return prisma.expense.findMany({
    where: {
      householdId,
      date: { gte: start, lt: end },
    },
    orderBy: { date: "desc" },
    select: expenseSelect,
  });
}

export async function findExpenseForEdit(householdId: string, id: string) {
  const prisma = await getPrisma();
  return prisma.expense.findFirst({
    where: { id, householdId },
    select: expenseSelect,
  });
}

export async function createExpense(input: PersistExpenseInput) {
  const prisma = await getPrisma();
  return prisma.expense.create({
    data: input,
    select: { id: true },
  });
}

export async function updateExpense(
  householdId: string,
  id: string,
  input: Omit<PersistExpenseInput, "householdId" | "userId">,
) {
  const prisma = await getPrisma();
  const existing = await prisma.expense.findFirst({
    where: { id, householdId },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return prisma.expense.update({
    where: { id: existing.id },
    data: input,
    select: { id: true },
  });
}

export async function deleteExpense(householdId: string, id: string) {
  const prisma = await getPrisma();
  const existing = await prisma.expense.findFirst({
    where: { id, householdId },
    select: { id: true },
  });

  if (!existing) {
    return false;
  }

  await prisma.expense.delete({ where: { id: existing.id } });
  return true;
}

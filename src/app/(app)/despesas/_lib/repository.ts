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
      sortOrder: true,
      archivedAt: true,
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
      color: true,
      icon: true,
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

export type CurrentExpenseCategoryIds = Pick<
  PersistExpenseInput,
  "areaCategoryId" | "areaSubcategoryId" | "profileCategoryId"
>;

function activeOrSelectedFilter(selectedId?: string) {
  return selectedId
    ? { OR: [{ archivedAt: null }, { id: selectedId }] }
    : { archivedAt: null };
}

export async function findExpenseOptions(
  householdId: string,
  currentExpenseCategoryIds?: CurrentExpenseCategoryIds,
) {
  const prisma = await getPrisma();
  const [areaCategories, profileCategories, members] =
    await prisma.$transaction([
      prisma.category.findMany({
        where: {
          householdId,
          kind: CategoryKind.AREA,
          type: TransactionType.EXPENSE,
          ...activeOrSelectedFilter(currentExpenseCategoryIds?.areaCategoryId),
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
          sortOrder: true,
          archivedAt: true,
          areaSubcategories: {
            where: activeOrSelectedFilter(
              currentExpenseCategoryIds?.areaSubcategoryId,
            ),
            orderBy: { name: "asc" },
            select: { id: true, name: true, archivedAt: true },
          },
        },
      }),
      prisma.category.findMany({
        where: {
          householdId,
          kind: CategoryKind.PROFILE,
          type: TransactionType.EXPENSE,
          ...activeOrSelectedFilter(
            currentExpenseCategoryIds?.profileCategoryId,
          ),
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
          sortOrder: true,
          archivedAt: true,
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
  existingExpenseId?: string,
) {
  const prisma = await getPrisma();
  const currentExpense = existingExpenseId
    ? await prisma.expense.findFirst({
        where: { id: existingExpenseId, householdId },
        select: {
          areaCategoryId: true,
          areaSubcategoryId: true,
          profileCategoryId: true,
        },
      })
    : null;
  const keepingAreaCategory =
    input.areaCategoryId === currentExpense?.areaCategoryId;
  const keepingAreaSubcategory =
    input.areaSubcategoryId === currentExpense?.areaSubcategoryId;
  const keepingProfileCategory =
    input.profileCategoryId === currentExpense?.profileCategoryId;
  const [areaCategory, areaSubcategory, profileCategory, responsibleMember] =
    await prisma.$transaction([
      prisma.category.findFirst({
        where: {
          id: input.areaCategoryId,
          householdId,
          kind: CategoryKind.AREA,
          type: TransactionType.EXPENSE,
          ...(keepingAreaCategory ? {} : { archivedAt: null }),
        },
        select: { id: true },
      }),
      prisma.areaSubcategory.findFirst({
        where: {
          id: input.areaSubcategoryId,
          areaCategoryId: input.areaCategoryId,
          ...(keepingAreaSubcategory ? {} : { archivedAt: null }),
          areaCategory: {
            is: {
              householdId,
              kind: CategoryKind.AREA,
              type: TransactionType.EXPENSE,
              ...(keepingAreaCategory ? {} : { archivedAt: null }),
            },
          },
        },
        select: { id: true },
      }),
      prisma.category.findFirst({
        where: {
          id: input.profileCategoryId,
          householdId,
          kind: CategoryKind.PROFILE,
          type: TransactionType.EXPENSE,
          ...(keepingProfileCategory ? {} : { archivedAt: null }),
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

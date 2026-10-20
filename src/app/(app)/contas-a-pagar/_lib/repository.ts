import { Prisma } from "@/prisma/generated/client";

async function getPrisma() {
  const database = await import("@/src/lib/db/prisma");
  return database.prisma;
}

export const DEFAULT_PAYABLE_ITEMS = [
  { defaultKey: "condominio", name: "condominio" },
  { defaultKey: "cartao-xp", name: "cartão XP" },
  { defaultKey: "cartao-picpay", name: "cartão PicPay" },
  { defaultKey: "cartao-btg", name: "cartão BTG" },
  { defaultKey: "cemig-sim", name: "cemig sim" },
  { defaultKey: "iptu", name: "iptu" },
  { defaultKey: "ipva-moto", name: "ipva moto" },
  { defaultKey: "ipva-kicks", name: "ipva kicks" },
  { defaultKey: "ipva-march", name: "ipva march" },
  { defaultKey: "cofrinho-felipe", name: "cofrinho felipe" },
  { defaultKey: "cofrinho-leo", name: "cofrinho leo" },
  { defaultKey: "coinha", name: "coinha" },
  { defaultKey: "momo-me-pagou", name: "momo me pagou" },
] as const;

export type FindPayableItemsForMonthInput = {
  householdId: string;
  year: number;
  month: number;
  periodStart: Date;
  periodEnd: Date;
};

export type SetMonthlyPayableStatusInput =
  FindPayableItemsForMonthInput & {
    itemId: string;
    isPaid: boolean;
  };

export type PayableMonthRecord = Prisma.PayableItemGetPayload<{
  select: {
    id: true;
    name: true;
    sortOrder: true;
    monthlyStatuses: {
      select: {
        isPaid: true;
      };
    };
  };
}>;

export type PayableManagementRecord = Prisma.PayableItemGetPayload<{
  select: {
    id: true;
    name: true;
    sortOrder: true;
    archivedAt: true;
  };
}>;

export async function ensureDefaultPayableItems(householdId: string) {
  const prisma = await getPrisma();

  await prisma.payableItem.createMany({
    data: DEFAULT_PAYABLE_ITEMS.map((item, sortOrder) => ({
      householdId,
      defaultKey: item.defaultKey,
      name: item.name,
      sortOrder,
    })),
    skipDuplicates: true,
  });
}

export async function findPayableItemsForMonth({
  householdId,
  year,
  month,
  periodStart,
  periodEnd,
}: FindPayableItemsForMonthInput) {
  const prisma = await getPrisma();

  return prisma.payableItem.findMany({
    where: {
      householdId,
      createdAt: { lt: periodEnd },
      OR: [{ archivedAt: null }, { archivedAt: { gte: periodStart } }],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      sortOrder: true,
      monthlyStatuses: {
        where: { year, month },
        select: { isPaid: true },
      },
    },
  });
}

export async function findPayableItemsForManagement(householdId: string) {
  const prisma = await getPrisma();

  return prisma.payableItem.findMany({
    where: { householdId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      sortOrder: true,
      archivedAt: true,
    },
  });
}

export async function createPayableItem(householdId: string, name: string) {
  const prisma = await getPrisma();
  const lastItem = await prisma.payableItem.findFirst({
    where: { householdId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  return prisma.payableItem.create({
    data: {
      householdId,
      name,
      sortOrder: (lastItem?.sortOrder ?? -1) + 1,
    },
    select: { id: true },
  });
}

export async function renamePayableItem(
  householdId: string,
  itemId: string,
  name: string,
) {
  const prisma = await getPrisma();
  const result = await prisma.payableItem.updateMany({
    where: { id: itemId, householdId, archivedAt: null },
    data: { name },
  });

  return result.count > 0;
}

export type MovePayableItemResult = "moved" | "not-found" | "at-boundary";

export async function movePayableItem(
  householdId: string,
  itemId: string,
  direction: "up" | "down",
): Promise<MovePayableItemResult> {
  const prisma = await getPrisma();

  return prisma.$transaction(async (transaction) => {
    const items = await transaction.payableItem.findMany({
      where: { householdId, archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      select: { id: true, sortOrder: true },
    });
    const currentIndex = items.findIndex((item) => item.id === itemId);

    if (currentIndex < 0) {
      return "not-found";
    }

    const nextIndex = currentIndex + (direction === "up" ? -1 : 1);

    if (nextIndex < 0 || nextIndex >= items.length) {
      return "at-boundary";
    }

    const currentItem = items[currentIndex];
    const nextItem = items[nextIndex];

    await transaction.payableItem.updateMany({
      where: { id: currentItem.id, householdId, archivedAt: null },
      data: { sortOrder: nextItem.sortOrder },
    });
    await transaction.payableItem.updateMany({
      where: { id: nextItem.id, householdId, archivedAt: null },
      data: { sortOrder: currentItem.sortOrder },
    });

    return "moved";
  });
}

export async function archivePayableItem(
  householdId: string,
  itemId: string,
  archivedAt = new Date(),
) {
  const prisma = await getPrisma();
  const result = await prisma.payableItem.updateMany({
    where: { id: itemId, householdId, archivedAt: null },
    data: { archivedAt },
  });

  return result.count > 0;
}

export async function setMonthlyPayableStatus({
  householdId,
  itemId,
  year,
  month,
  periodStart,
  periodEnd,
  isPaid,
}: SetMonthlyPayableStatusInput) {
  const prisma = await getPrisma();

  return prisma.$transaction(async (transaction) => {
    const item = await transaction.payableItem.findFirst({
      where: {
        id: itemId,
        householdId,
        createdAt: { lt: periodEnd },
        OR: [{ archivedAt: null }, { archivedAt: { gte: periodStart } }],
      },
      select: { id: true },
    });

    if (!item) {
      return false;
    }

    await transaction.payableItemMonthlyStatus.upsert({
      where: {
        payableItemId_year_month: {
          payableItemId: item.id,
          year,
          month,
        },
      },
      update: { isPaid },
      create: {
        payableItemId: item.id,
        year,
        month,
        isPaid,
      },
    });

    return true;
  });
}

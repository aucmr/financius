import type { AuthContext } from "@/src/lib/auth/context";
import { getMonthRange, isValidMonth } from "@/src/lib/utils/date";

import type { PayableItemFormValues } from "@/src/app/(app)/contas-a-pagar/_lib/schemas";
import {
  archivePayableItem as archivePayableItemRecord,
  createPayableItem as createPayableItemRecord,
  ensureDefaultPayableItems,
  findPayableItemsForManagement,
  findPayableItemsForMonth,
  movePayableItem as movePayableItemRecord,
  renamePayableItem as renamePayableItemRecord,
  setMonthlyPayableStatus as setMonthlyPayableStatusRecord,
} from "@/src/app/(app)/contas-a-pagar/_lib/repository";

export class PayableItemNotFoundError extends Error {
  constructor() {
    super("O item da checklist não foi encontrado.");
    this.name = "PayableItemNotFoundError";
  }
}

export class PayableValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayableValidationError";
  }
}

export type PayablesRepository = {
  ensureDefaultPayableItems: typeof ensureDefaultPayableItems;
  findPayableItemsForMonth: typeof findPayableItemsForMonth;
  findPayableItemsForManagement: typeof findPayableItemsForManagement;
  createPayableItem: typeof createPayableItemRecord;
  renamePayableItem: typeof renamePayableItemRecord;
  movePayableItem: typeof movePayableItemRecord;
  archivePayableItem: typeof archivePayableItemRecord;
  setMonthlyPayableStatus: typeof setMonthlyPayableStatusRecord;
};

const defaultRepository: PayablesRepository = {
  ensureDefaultPayableItems,
  findPayableItemsForMonth,
  findPayableItemsForManagement,
  createPayableItem: createPayableItemRecord,
  renamePayableItem: renamePayableItemRecord,
  movePayableItem: movePayableItemRecord,
  archivePayableItem: archivePayableItemRecord,
  setMonthlyPayableStatus: setMonthlyPayableStatusRecord,
};

function getMonthParts(month: string) {
  if (!isValidMonth(month)) {
    throw new PayableValidationError("Mês inválido.");
  }

  const [year, monthNumber] = month.split("-").map(Number);

  return {
    year,
    month: monthNumber,
    ...getMonthRange(month),
  };
}

export async function getPayablesForMonth(
  context: AuthContext,
  month: string,
  repository: PayablesRepository = defaultRepository,
) {
  const period = getMonthParts(month);
  await repository.ensureDefaultPayableItems(context.householdId);

  const records = await repository.findPayableItemsForMonth({
    householdId: context.householdId,
    year: period.year,
    month: period.month,
    periodStart: period.start,
    periodEnd: period.end,
  });
  const items = records.map((record) => ({
    id: record.id,
    name: record.name,
    isPaid: record.monthlyStatuses[0]?.isPaid ?? false,
  }));
  const paidCount = items.filter((item) => item.isPaid).length;

  return {
    month,
    items,
    paidCount,
    pendingCount: items.length - paidCount,
  };
}

export async function getPayableItemsForManagement(
  context: AuthContext,
  repository: PayablesRepository = defaultRepository,
) {
  await repository.ensureDefaultPayableItems(context.householdId);
  return repository.findPayableItemsForManagement(context.householdId);
}

export async function createPayableItem(
  context: AuthContext,
  values: PayableItemFormValues,
  repository: PayablesRepository = defaultRepository,
) {
  const name = values.name.trim();

  if (!name) {
    throw new PayableValidationError("Informe o nome do item.");
  }

  await repository.ensureDefaultPayableItems(context.householdId);
  return repository.createPayableItem(context.householdId, name);
}

export async function renamePayableItem(
  context: AuthContext,
  itemId: string,
  values: PayableItemFormValues,
  repository: PayablesRepository = defaultRepository,
) {
  const name = values.name.trim();

  if (!name) {
    throw new PayableValidationError("Informe o nome do item.");
  }

  const updated = await repository.renamePayableItem(
    context.householdId,
    itemId,
    name,
  );

  if (!updated) {
    throw new PayableItemNotFoundError();
  }
}

export async function movePayableItem(
  context: AuthContext,
  itemId: string,
  direction: "up" | "down",
  repository: PayablesRepository = defaultRepository,
) {
  const result = await repository.movePayableItem(
    context.householdId,
    itemId,
    direction,
  );

  if (result === "not-found") {
    throw new PayableItemNotFoundError();
  }

  return result === "moved";
}

export async function archivePayableItem(
  context: AuthContext,
  itemId: string,
  repository: PayablesRepository = defaultRepository,
) {
  const archived = await repository.archivePayableItem(
    context.householdId,
    itemId,
  );

  if (!archived) {
    throw new PayableItemNotFoundError();
  }
}

export async function updateMonthlyPayableStatus(
  context: AuthContext,
  itemId: string,
  month: string,
  isPaid: boolean,
  repository: PayablesRepository = defaultRepository,
) {
  const period = getMonthParts(month);
  const updated = await repository.setMonthlyPayableStatus({
    householdId: context.householdId,
    itemId,
    year: period.year,
    month: period.month,
    periodStart: period.start,
    periodEnd: period.end,
    isPaid,
  });

  if (!updated) {
    throw new PayableItemNotFoundError();
  }
}

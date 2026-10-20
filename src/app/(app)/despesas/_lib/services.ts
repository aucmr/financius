import type { AuthContext } from "@/src/lib/auth/context";
import {
  formatDateOnly,
  getMonthRange,
  parseDateOnly,
} from "@/src/lib/utils/date";

import type { ExpenseFormValues } from "@/src/app/(app)/despesas/_lib/schemas";
import {
  createExpense as createExpenseRecord,
  deleteExpense as deleteExpenseRecord,
  findExpenseForEdit,
  findExpenseReferences,
  type ExpenseRecord,
  findExpenses,
  updateExpense as updateExpenseRecord,
} from "@/src/app/(app)/despesas/_lib/repository";

export class ExpenseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpenseValidationError";
  }
}

export class ExpenseNotFoundError extends Error {
  constructor() {
    super("A despesa não foi encontrada.");
    this.name = "ExpenseNotFoundError";
  }
}

type PersistedExpenseValues = {
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

export type ExpenseRepository = {
  findExpenseReferences: typeof findExpenseReferences;
  createExpense: typeof createExpenseRecord;
  updateExpense: typeof updateExpenseRecord;
  deleteExpense: typeof deleteExpenseRecord;
  findExpenseForEdit: typeof findExpenseForEdit;
  findExpenses: typeof findExpenses;
};

const defaultRepository: ExpenseRepository = {
  findExpenseReferences,
  createExpense: createExpenseRecord,
  updateExpense: updateExpenseRecord,
  deleteExpense: deleteExpenseRecord,
  findExpenseForEdit,
  findExpenses,
};

function normalizeAmount(value: string, allowNegative = false) {
  const normalized = value.replace(",", ".");
  const isNegative = normalized.startsWith("-");
  const unsignedValue = isNegative ? normalized.slice(1) : normalized;
  const [whole, fraction = ""] = unsignedValue.split(".");
  const cents =
    (Number(whole) * 100 + Number(fraction.padEnd(2, "0"))) *
    (isNegative ? -1 : 1);

  if (
    !Number.isSafeInteger(cents) ||
    (allowNegative ? cents === 0 : cents <= 0)
  ) {
    throw new ExpenseValidationError(
      allowNegative
        ? "O valor nao pode ser zero."
        : "O valor deve ser maior que zero.",
    );
  }

  return `${isNegative ? "-" : ""}${whole}.${fraction.padEnd(2, "0")}`;
}

function toPersistedValues(
  values: ExpenseFormValues,
  allowNegative = false,
): PersistedExpenseValues {
  return {
    description: values.description.trim(),
    amount: normalizeAmount(values.amount, allowNegative),
    date: parseDateOnly(values.date),
    areaCategoryId: values.areaCategoryId,
    areaSubcategoryId: values.areaSubcategoryId,
    profileCategoryId: values.profileCategoryId,
    responsibleUserId: values.responsibleUserId,
    notes: values.notes.trim() || null,
    recurring: values.recurring,
    shared: values.shared,
  };
}

async function assertReferences(
  context: AuthContext,
  values: PersistedExpenseValues,
  repository: ExpenseRepository,
  existingExpenseId?: string,
) {
  const references = await repository.findExpenseReferences(
    context.householdId,
    values,
    existingExpenseId,
  );

  if (!references.areaCategory) {
    throw new ExpenseValidationError(
      "A categoria de área selecionada é inválida.",
    );
  }

  if (!references.areaSubcategory) {
    throw new ExpenseValidationError(
      "A subcategoria não pertence à categoria de área selecionada.",
    );
  }

  if (!references.profileCategory) {
    throw new ExpenseValidationError(
      "A categoria de perfil selecionada é inválida.",
    );
  }

  if (!references.responsibleMember) {
    throw new ExpenseValidationError(
      "O responsável precisa ser membro do mesmo household.",
    );
  }
}

export async function createExpense(
  context: AuthContext,
  values: ExpenseFormValues,
  repository: ExpenseRepository = defaultRepository,
) {
  const persistedValues = toPersistedValues(values);
  await assertReferences(context, persistedValues, repository);

  return repository.createExpense({
    householdId: context.householdId,
    userId: context.userId,
    ...persistedValues,
  });
}

export async function updateExpense(
  context: AuthContext,
  id: string,
  values: ExpenseFormValues,
  repository: ExpenseRepository = defaultRepository,
) {
  const persistedValues = toPersistedValues(values, true);
  await assertReferences(context, persistedValues, repository, id);

  const updated = await repository.updateExpense(
    context.householdId,
    id,
    persistedValues,
  );

  if (!updated) {
    throw new ExpenseNotFoundError();
  }

  return updated;
}

export async function deleteExpense(
  context: AuthContext,
  id: string,
  repository: ExpenseRepository = defaultRepository,
) {
  const deleted = await repository.deleteExpense(context.householdId, id);

  if (!deleted) {
    throw new ExpenseNotFoundError();
  }
}

export function mapExpense(record: ExpenseRecord) {
  const { archivedAt: areaCategoryArchivedAt, ...areaCategory } =
    record.areaCategory;

  return {
    id: record.id,
    description: record.description,
    amount: record.amount.toString(),
    date: formatDateOnly(record.date),
    creditCardTransactionDate: record.creditCardTransactionDate
      ? formatDateOnly(record.creditCardTransactionDate)
      : null,
    importSource: record.importBatch?.source ?? null,
    importFileName: record.importBatch?.fileName ?? null,
    notes: record.notes,
    recurring: record.recurring,
    shared: record.shared,
    areaCategory: {
      ...areaCategory,
      isArchived: areaCategoryArchivedAt !== null,
    },
    areaSubcategory: record.areaSubcategory,
    profileCategory: record.profileCategory,
    creator: record.user,
    responsibleUser: record.responsibleUser,
  };
}

export function getExpenseMonthTotals(records: ExpenseRecord[]) {
  return records.reduce(
    (totals, record) => {
      const amount = Number(record.amount.toString());
      totals.total += amount;

      if (record.shared) {
        totals.shared += amount;
      }

      return totals;
    },
    { total: 0, shared: 0 },
  );
}

export function getExpenseDateRange(month: string) {
  return getMonthRange(month);
}

export async function getExpenseForEdit(
  context: AuthContext,
  id: string,
  repository: ExpenseRepository = defaultRepository,
) {
  const record = await repository.findExpenseForEdit(context.householdId, id);
  return record ? mapExpense(record) : null;
}

export async function getExpensesForMonth(
  context: AuthContext,
  month: string,
  repository: ExpenseRepository = defaultRepository,
) {
  const { start, end } = getExpenseDateRange(month);
  const records = await repository.findExpenses(
    context.householdId,
    start,
    end,
  );

  return {
    records,
    expenses: records.map(mapExpense),
    totals: getExpenseMonthTotals(records),
  };
}

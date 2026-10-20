import { getAuthContext } from "@/src/lib/auth/context";
import { formatDateOnly, normalizeMonth } from "@/src/lib/utils/date";

import { findExpenseOptions } from "@/src/app/(app)/despesas/_lib/repository";
import {
  getExpenseForEdit,
  getExpensesForMonth,
} from "@/src/app/(app)/despesas/_lib/services";
import type { ExpenseFormValues } from "@/src/app/(app)/despesas/_lib/schemas";
import type { ExpenseOptions } from "@/src/app/(app)/despesas/_lib/types";

function mapOptions(
  options: Awaited<ReturnType<typeof findExpenseOptions>>,
): ExpenseOptions {
  return {
    areaCategories: options.areaCategories.map(
      ({ areaSubcategories, archivedAt, ...category }) => ({
        ...category,
        isArchived: archivedAt !== null,
        subcategories: areaSubcategories.map(
          ({ archivedAt: subcategoryArchivedAt, ...subcategory }) => ({
            ...subcategory,
            isArchived: subcategoryArchivedAt !== null,
          }),
        ),
      }),
    ),
    profileCategories: options.profileCategories.map(
      ({ archivedAt, ...category }) => ({
        ...category,
        isArchived: archivedAt !== null,
      }),
    ),
    members: options.members,
  };
}

export async function getExpensePageData(requestedMonth: unknown) {
  const context = await getAuthContext();
  const month = normalizeMonth(requestedMonth);
  const [options, expenses] = await Promise.all([
    findExpenseOptions(context.householdId),
    getExpensesForMonth(context, month),
  ]);

  return {
    month,
    householdName: context.householdName,
    currentUserId: context.userId,
    members: options.members,
    options: mapOptions(options),
    expenses: expenses.expenses,
    totalAmount: expenses.totals.total.toFixed(2),
    sharedAmount: expenses.totals.shared.toFixed(2),
  };
}

export async function getExpenseFormData(id?: string) {
  const context = await getAuthContext();
  const expense = id ? await getExpenseForEdit(context, id) : null;
  const options = await findExpenseOptions(
    context.householdId,
    expense
      ? {
          areaCategoryId: expense.areaCategory.id,
          areaSubcategoryId: expense.areaSubcategory.id,
          profileCategoryId: expense.profileCategory.id,
        }
      : undefined,
  );

  const initialValues: ExpenseFormValues | null = expense
    ? {
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        areaCategoryId: expense.areaCategory.id,
        areaSubcategoryId: expense.areaSubcategory.id,
        profileCategoryId: expense.profileCategory.id,
        responsibleUserId: expense.responsibleUser.id,
        notes: expense.notes ?? "",
        recurring: expense.recurring,
        shared: expense.shared,
      }
    : {
        description: "",
        amount: "",
        date: formatDateOnly(new Date()),
        areaCategoryId: "",
        areaSubcategoryId: "",
        profileCategoryId: "",
        responsibleUserId: context.userId,
        notes: "",
        recurring: false,
        shared: false,
      };

  return {
    currentUserId: context.userId,
    householdName: context.householdName,
    options: mapOptions(options),
    initialValues,
    exists: Boolean(expense),
  };
}

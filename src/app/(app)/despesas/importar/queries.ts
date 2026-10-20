import { getAuthContext } from "@/src/lib/auth/context";
import { findExpenseOptions } from "@/src/app/(app)/despesas/importar/_lib/repository";
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

export async function getImportPageData() {
  const context = await getAuthContext();
  const options = await findExpenseOptions(context.householdId);

  return {
    householdName: context.householdName,
    currentUserId: context.userId,
    options: mapOptions(options),
  };
}

import { getAuthContext } from "@/src/lib/auth/context";
import { findExpenseOptions } from "@/src/app/(app)/despesas/importar/_lib/repository";
import type { ExpenseOptions } from "@/src/app/(app)/despesas/_lib/types";

function mapOptions(
  options: Awaited<ReturnType<typeof findExpenseOptions>>,
): ExpenseOptions {
  return {
    areaCategories: options.areaCategories.map((category) => ({
      ...category,
      subcategories: category.areaSubcategories,
    })),
    profileCategories: options.profileCategories,
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

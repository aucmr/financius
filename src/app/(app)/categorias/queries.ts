import { getAuthContext } from "@/src/lib/auth/context";

import { getCategoriesForManagement } from "@/src/app/(app)/categorias/_lib/services";

export async function getCategoryManagementPageData() {
  const context = await getAuthContext();
  return getCategoriesForManagement(context);
}

import { getAuthContext } from "@/src/lib/auth/context";
import { normalizeMonth } from "@/src/lib/utils/date";

import {
  getPayableItemsForManagement,
  getPayablesForMonth,
} from "@/src/app/(app)/contas-a-pagar/_lib/services";

export async function getPayableChecklistPageData(requestedMonth: unknown) {
  const context = await getAuthContext();
  const month = normalizeMonth(requestedMonth);
  const data = await getPayablesForMonth(context, month);

  return {
    ...data,
    householdName: context.householdName,
  };
}

export async function getPayableManagementPageData() {
  const context = await getAuthContext();
  const items = await getPayableItemsForManagement(context);

  return {
    householdName: context.householdName,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      sortOrder: item.sortOrder,
      archivedAt: item.archivedAt?.toISOString() ?? null,
    })),
  };
}

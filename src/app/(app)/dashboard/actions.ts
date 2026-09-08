import type { DashboardStat } from "@/src/app/(app)/dashboard/types";

export async function getDashboardStats(): Promise<DashboardStat[]> {
  return [
    { label: "Users", value: "0" },
    { label: "Active Sessions", value: "0" },
    { label: "Open Tasks", value: "0" },
  ];
}

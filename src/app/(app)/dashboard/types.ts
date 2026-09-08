export type DashboardMetric = {
  id: "balance" | "income" | "expenses" | "sharedExpenses";
  label: string;
  value: number | null;
  description: string;
  icon: string;
};

export type DashboardOverview = {
  periodLabel: string;
  metrics: DashboardMetric[];
  chartStatus: "empty";
};

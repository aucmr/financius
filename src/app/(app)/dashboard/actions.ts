import type { DashboardOverview } from "@/src/app/(app)/dashboard/types";

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const periodLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return {
    periodLabel: periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1),
    metrics: [
      {
        id: "balance",
        label: "Saldo do mês",
        value: null,
        description: "Aguardando lançamentos",
        icon: "icon-[tabler--scale]",
      },
      {
        id: "income",
        label: "Receitas",
        value: null,
        description: "Nenhuma receita registrada",
        icon: "icon-[tabler--arrow-up-right]",
      },
      {
        id: "expenses",
        label: "Despesas",
        value: null,
        description: "Nenhuma despesa registrada",
        icon: "icon-[tabler--arrow-down-left]",
      },
      {
        id: "sharedExpenses",
        label: "Despesas compartilhadas",
        value: null,
        description: "Sem dados para dividir",
        icon: "icon-[tabler--users]",
      },
    ],
    chartStatus: "empty",
  };
}

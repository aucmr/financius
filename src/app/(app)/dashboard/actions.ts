import { ArrowDownLeftIcon, ArrowUpRightIcon, ScaleIcon, UsersIcon } from "lucide-react";

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
        icon: ScaleIcon,
      },
      {
        id: "income",
        label: "Receitas",
        value: null,
        description: "Nenhuma receita registrada",
        icon: ArrowUpRightIcon,
      },
      {
        id: "expenses",
        label: "Despesas",
        value: null,
        description: "Nenhuma despesa registrada",
        icon: ArrowDownLeftIcon,
      },
      {
        id: "sharedExpenses",
        label: "Despesas compartilhadas",
        value: null,
        description: "Sem dados para dividir",
        icon: UsersIcon,
      },
    ],
    chartStatus: "empty",
  };
}

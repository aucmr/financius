"use client";

import {
  Cell,
  Label,
  Pie,
  PieChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/src/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/src/components/ui/empty";
import type { ExpenseCategoryTotal } from "@/src/app/(app)/despesas/_lib/types";
import { formatCurrency } from "@/src/lib/utils/currency";

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
});

type ExpenseDistributionChartsProps = {
  areas: ExpenseCategoryTotal[];
  profiles: ExpenseCategoryTotal[];
};

type ExpenseDistributionCardProps = {
  title: string;
  description: string;
  data: ExpenseCategoryTotal[];
};

function ExpenseDistributionCard({
  title,
  description,
  data,
}: ExpenseDistributionCardProps) {
  const totalInCents = data.reduce(
    (total, category) => total + Math.round(category.amount * 100),
    0,
  );
  const total = totalInCents / 100;
  const chartConfig = data.reduce<ChartConfig>((config, category) => {
    config[category.id] = {
      label: category.name,
      color: category.color,
    };
    return config;
  }, {});
  const categoryNames = new Map(
    data.map((category) => [category.id, category.name] as const),
  );

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {data.length === 0 ? (
          <Empty className="min-h-56 border-0 p-0">
            <EmptyHeader>
              <EmptyTitle>Sem despesas nesta competência</EmptyTitle>
              <EmptyDescription>
                Adicione despesas para visualizar sua distribuição por categoria.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid flex-1 items-center gap-4 xl:grid-cols-2">
            <ChartContainer
              config={chartConfig}
              className="mx-auto h-[220px] w-full max-w-[220px]"
            >
              <PieChart accessibilityLayer>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      nameKey="id"
                      formatter={(value, categoryId) => (
                        <div className="flex flex-1 items-center justify-between gap-4">
                          <span>
                            {categoryNames.get(String(categoryId)) ??
                              String(categoryId)}
                          </span>
                          <span className="font-mono font-medium tabular-nums">
                            {formatCurrency(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="id"
                  innerRadius={58}
                  outerRadius={88}
                  stroke="var(--background)"
                  strokeWidth={3}
                >
                  {data.map((category) => (
                    <Cell key={category.id} fill={category.color} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (
                        !viewBox ||
                        !("cx" in viewBox) ||
                        !("cy" in viewBox)
                      ) {
                        return null;
                      }

                      const centerX = Number(viewBox.cx);
                      const centerY = Number(viewBox.cy);

                      return (
                        <text textAnchor="middle">
                          <tspan
                            x={centerX}
                            y={centerY}
                            className="fill-foreground text-base font-semibold"
                          >
                            {formatCurrency(total)}
                          </tspan>
                          <tspan
                            x={centerX}
                            y={centerY + 20}
                            className="fill-muted-foreground text-[10px]"
                          >
                            Total
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul aria-label={`${title} por categoria`} className="grid gap-3">
              {data.map((category) => {
                const categoryInCents = Math.round(category.amount * 100);
                const share =
                  totalInCents > 0 ? categoryInCents / totalInCents : 0;

                return (
                  <li
                    key={category.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 text-sm"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="min-w-0 truncate">{category.name}</span>
                    <span className="shrink-0 text-right font-medium tabular-nums">
                      {formatCurrency(category.amount)}
                    </span>
                    <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                      {percentageFormatter.format(share)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ExpenseDistributionCharts({
  areas,
  profiles,
}: ExpenseDistributionChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ExpenseDistributionCard
        title="Despesas por área"
        description="Participação de cada área nos gastos da competência."
        data={areas}
      />
      <ExpenseDistributionCard
        title="Despesas por perfil"
        description="Participação de cada perfil nos gastos da competência."
        data={profiles}
      />
    </div>
  );
}

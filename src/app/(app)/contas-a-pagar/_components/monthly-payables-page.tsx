import Link from "next/link";
import { ListChecksIcon, Settings2Icon } from "lucide-react";

import { PayableStatusCheckbox } from "@/src/app/(app)/contas-a-pagar/_components/payable-status-checkbox";
import type { PayableChecklistPageData } from "@/src/app/(app)/contas-a-pagar/_lib/types";
import { MonthNavigation } from "@/src/app/(app)/despesas/_components/month-navigation";
import { Badge } from "@/src/components/ui/badge";
import { buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/src/components/ui/empty";
import { FieldGroup, FieldLegend, FieldSet } from "@/src/components/ui/field";
import { formatMonthLabel } from "@/src/lib/utils/date";

type MonthlyPayablesPageProps = {
  data: PayableChecklistPageData;
};

function SummaryStat({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function MonthlyPayablesPage({ data }: MonthlyPayablesPageProps) {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col items-start gap-2">
          <Badge variant="secondary">Contas a pagar</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Checklist mensal
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Acompanhe os pagamentos compartilhados de {data.householdName}.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <MonthNavigation month={data.month} basePath="/contas-a-pagar" />
          <Link
            href="/contas-a-pagar/gerenciar"
            className={buttonVariants({ variant: "secondary" })}
          >
            <Settings2Icon data-icon="inline-start" aria-hidden="true" />
            Gerenciar lista
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryStat
          title="Pagas"
          value={data.paidCount}
          description="Na competência selecionada"
        />
        <SummaryStat
          title="Pendentes"
          value={data.pendingCount}
          description="Ainda precisam ser pagas"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contas de {formatMonthLabel(data.month)}</CardTitle>
          <CardDescription>
            Marque cada item quando o pagamento for concluído.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.items.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ListChecksIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>Nenhum item nesta competência</EmptyTitle>
                <EmptyDescription>
                  Os itens cadastrados aparecem a partir do mês em que foram
                  adicionados.
                </EmptyDescription>
              </EmptyHeader>
              <Link
                href="/contas-a-pagar/gerenciar"
                className={buttonVariants({ variant: "secondary" })}
              >
                Gerenciar lista
              </Link>
            </Empty>
          ) : (
            <FieldSet>
              <FieldLegend className="sr-only">
                Contas a pagar em {formatMonthLabel(data.month)}
              </FieldLegend>
              <FieldGroup>
                {data.items.map((item) => (
                  <PayableStatusCheckbox
                    key={`${item.id}-${data.month}`}
                    itemId={item.id}
                    itemName={item.name}
                    month={data.month}
                    initiallyPaid={item.isPaid}
                  />
                ))}
              </FieldGroup>
            </FieldSet>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

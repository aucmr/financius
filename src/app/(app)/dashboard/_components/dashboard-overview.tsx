import { ChartPieIcon, CalendarDaysIcon, InfoIcon, ScaleIcon, SparklesIcon } from "lucide-react";

import { getDashboardOverview } from "@/src/app/(app)/dashboard/actions";
import type { DashboardMetric } from "@/src/app/(app)/dashboard/types";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/src/components/ui/empty";

type DashboardOverviewProps = {
    userName: string | null;
};

function formatCurrency(value: number | null) {
    if (value === null) {
        return "--";
    }

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function getGreetingName(userName: string | null) {
    return userName?.trim().split(/\s+/)[0] || "vocês";
}

function MetricStat({ metric }: { metric: DashboardMetric }) {
    const Icon = metric.icon;

    return (
        <Card size="sm" className="min-w-0">
            <CardHeader>
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-2xl sm:text-3xl">{formatCurrency(metric.value)}</CardTitle>
                <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end text-muted-foreground">
                    <Icon aria-hidden="true" />
                </div>
                <CardDescription className="text-xs">{metric.description}</CardDescription>
            </CardHeader>
        </Card>
    );
}

function EmptyChart() {
    return (
        <Empty className="min-h-64 bg-muted/50" role="img" aria-label="Gráfico mensal sem dados">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <ChartPieIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>O gráfico começa com o primeiro lançamento</EmptyTitle>
                <EmptyDescription>
                    Registre receitas e despesas para acompanhar o fluxo financeiro do mês.
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}

export async function DashboardOverview({ userName }: DashboardOverviewProps) {
    const overview = await getDashboardOverview();

    return (
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
            <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col items-start gap-2">
                    <Badge variant="secondary">Visão mensal</Badge>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        Olá, {getGreetingName(userName)}
                    </h1>
                    <p className="max-w-2xl text-base text-muted-foreground">
                        Uma visão simples do que entrou, saiu e foi compartilhado neste mês.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDaysIcon className="size-5" aria-hidden="true" />
                    <span>{overview.periodLabel}</span>
                </div>
            </header>

            <Alert>
                <InfoIcon aria-hidden="true" />
                <AlertTitle>Seu espaço financeiro está pronto</AlertTitle>
                <AlertDescription>
                    Os indicadores serão preenchidos quando os primeiros lançamentos forem registrados.
                </AlertDescription>
            </Alert>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {overview.metrics.map((metric) => (
                    <MetricStat key={metric.id} metric={metric} />
                ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Fluxo do mês</CardTitle>
                        <CardDescription>Compare receitas e despesas ao longo da competência.</CardDescription>
                        <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                            <Badge variant="outline">Sem dados</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>{overview.chartStatus === "empty" && <EmptyChart />}</CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Divisão do casal</CardTitle>
                        <CardDescription>
                            A divisão mensal aparece aqui depois que houver despesas compartilhadas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Alert>
                            <ScaleIcon aria-hidden="true" />
                            <AlertDescription>Ainda não há despesas compartilhadas para calcular.</AlertDescription>
                        </Alert>
                        <div className="flex items-center gap-3 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                            <SparklesIcon className="size-5 shrink-0" aria-hidden="true" />
                            <span>Vocês poderão escolher a regra de divisão que faz sentido para o casal.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}

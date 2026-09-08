import { getDashboardOverview } from "@/src/app/(app)/dashboard/actions";
import type { DashboardMetric } from "@/src/app/(app)/dashboard/types";

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
    return (
        <div className="stat min-w-0 border-b-0 lg:border-e-0">
            <div className="stat-figure">
                <span className="inline-flex size-8 items-center justify-center rounded-field bg-primary/10 text-primary">
                    <span className={`${metric.icon} size-5`} aria-hidden="true" />
                </span>
            </div>
            <div className="stat-title text-sm leading-tight">{metric.label}</div>
            <div className="stat-value text-2xl sm:text-3xl">{formatCurrency(metric.value)}</div>
            <div className="stat-desc text-xs leading-tight">{metric.description}</div>
        </div>
    );
}

function EmptyChart() {
    return (
        <div
            className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-box bg-base-200/70 px-6 text-center"
            role="img"
            aria-label="Gráfico mensal sem dados"
        >
            <span className="icon-[tabler--chart-donut-4] size-10 text-primary/70" aria-hidden="true" />
            <div className="max-w-sm space-y-1">
                <p className="font-semibold text-base-content">O gráfico começa com o primeiro lançamento</p>
                <p className="text-sm text-base-content/60">
                    Registre receitas e despesas para acompanhar o fluxo financeiro do mês.
                </p>
            </div>
        </div>
    );
}

export async function DashboardOverview({ userName }: DashboardOverviewProps) {
    const overview = await getDashboardOverview();

    return (
        <section className="mx-auto w-full max-w-7xl space-y-8">
            <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                    <span className="badge badge-soft badge-primary">Visão mensal</span>
                    <h1 className="text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">
                        Olá, {getGreetingName(userName)}
                    </h1>
                    <p className="max-w-2xl text-base text-base-content/60">
                        Uma visão simples do que entrou, saiu e foi compartilhado neste mês.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-base-content/60">
                    <span className="icon-[tabler--calendar-month] size-5" aria-hidden="true" />
                    <span>{overview.periodLabel}</span>
                </div>
            </header>

            <div className="alert alert-soft alert-info items-start">
                <span className="icon-[tabler--info-circle] mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div>
                    <h2 className="font-semibold">Seu espaço financeiro está pronto</h2>
                    <p className="text-sm">
                        Os indicadores serão preenchidos quando os primeiros lançamentos forem registrados.
                    </p>
                </div>
            </div>

            <div className="stats stats-vertical w-full overflow-hidden bg-base-100 shadow-md lg:stats-horizontal">
                {overview.metrics.map((metric) => (
                    <MetricStat key={metric.id} metric={metric} />
                ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
                <section className="card bg-base-100 shadow-md">
                    <div className="card-body gap-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="card-title text-xl">Fluxo do mês</h2>
                                <p className="text-sm text-base-content/60">
                                    Compare receitas e despesas ao longo da competência.
                                </p>
                            </div>
                            <span className="badge badge-outline">Sem dados</span>
                        </div>
                        {overview.chartStatus === "empty" && <EmptyChart />}
                    </div>
                </section>

                <section className="card bg-base-100 shadow-md">
                    <div className="card-body gap-5">
                        <div>
                            <h2 className="card-title text-xl">Divisão do casal</h2>
                            <p className="text-sm text-base-content/60">
                                A divisão mensal aparece aqui depois que houver despesas compartilhadas.
                            </p>
                        </div>
                        <div className="alert alert-soft alert-warning items-start">
                            <span className="icon-[tabler--scale] mt-0.5 size-5 shrink-0" aria-hidden="true" />
                            <p className="text-sm">Ainda não há despesas compartilhadas para calcular.</p>
                        </div>
                        <div className="flex items-center gap-3 rounded-box bg-base-200 p-4 text-sm text-base-content/70">
                            <span className="icon-[tabler--sparkles] size-5 shrink-0 text-secondary" aria-hidden="true" />
                            <span>Vocês poderão escolher a regra de divisão que faz sentido para o casal.</span>
                        </div>
                    </div>
                </section>
            </div>
        </section>
    );
}

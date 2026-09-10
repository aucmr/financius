import Link from "next/link";

import { HouseholdMemberForm } from "@/src/app/(app)/despesas/_components/household-member-form";
import { ExpenseTable } from "@/src/app/(app)/despesas/_components/expense-table";
import { MonthNavigation } from "@/src/app/(app)/despesas/_components/month-navigation";
import type { ExpensePageData } from "@/src/app/(app)/despesas/_lib/types";

type ExpenseMonthPageProps = {
    data: ExpensePageData;
};

function formatCurrency(value: string) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(value));
}

export function ExpenseMonthPage({ data }: ExpenseMonthPageProps) {
    const canAssociateMember = data.members.length < 2;

    return (
        <section className="mx-auto w-full max-w-7xl space-y-8">
            <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="space-y-2">
                    <span className="badge badge-soft badge-primary">Despesas</span>
                    <h1 className="text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">Despesas do casal</h1>
                    <p className="max-w-2xl text-base text-base-content/60">
                        Acompanhe os lançamentos de {data.householdName} agrupados por área e subcategoria.
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <MonthNavigation month={data.month} />
                    <Link href="/despesas/nova" className="btn btn-primary gap-2">
                        <span className="icon-[tabler--plus] size-4" aria-hidden="true" />
                        Nova despesa
                    </Link>
                </div>
            </header>

            <div className="stats stats-vertical w-full overflow-hidden bg-base-100 shadow-md lg:stats-horizontal">
                <div className="stat min-w-0 border-b-0 lg:border-e-0">
                    <div className="stat-figure text-primary"><span className="icon-[tabler--receipt] size-6" aria-hidden="true" /></div>
                    <div className="stat-title">Total do mês</div>
                    <div className="stat-value text-2xl">{formatCurrency(data.totalAmount)}</div>
                    <div className="stat-desc">Todos os lançamentos</div>
                </div>
                <div className="stat min-w-0 border-b-0 lg:border-e-0">
                    <div className="stat-figure text-secondary"><span className="icon-[tabler--scale] size-6" aria-hidden="true" /></div>
                    <div className="stat-title">Compartilhadas</div>
                    <div className="stat-value text-2xl">{formatCurrency(data.sharedAmount)}</div>
                    <div className="stat-desc">Base para a divisão futura</div>
                </div>
                <div className="stat min-w-0">
                    <div className="stat-figure text-accent"><span className="icon-[tabler--list-numbers] size-6" aria-hidden="true" /></div>
                    <div className="stat-title">Lançamentos</div>
                    <div className="stat-value text-2xl">{data.expenses.length}</div>
                    <div className="stat-desc">Na competência selecionada</div>
                </div>
            </div>

            {canAssociateMember && (
                <section className="card border border-dashed border-primary/40 bg-primary/4 shadow-sm">
                    <div className="card-body gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-1">
                            <h2 className="card-title text-lg">Complete o household</h2>
                            <p className="text-sm text-base-content/60">Associe a conta da outra pessoa para poder atribuir cada despesa ao responsável correto.</p>
                        </div>
                        <HouseholdMemberForm />
                    </div>
                </section>
            )}

            <section className="space-y-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-base-content">Lançamentos</h2>
                        <p className="text-sm text-base-content/60">Organizados por categoria de área e subcategoria.</p>
                    </div>
                    <span className="text-sm text-base-content/50">{data.expenses.length} {data.expenses.length === 1 ? "item" : "itens"}</span>
                </div>
                <ExpenseTable expenses={data.expenses} />
            </section>
        </section>
    );
}

import { FileUpIcon, ListOrderedIcon, PlusIcon, ReceiptTextIcon, ScaleIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { HouseholdMemberForm } from "@/src/app/(app)/despesas/_components/household-member-form";
import { ExpenseTable } from "@/src/app/(app)/despesas/_components/expense-table";
import { MonthNavigation } from "@/src/app/(app)/despesas/_components/month-navigation";
import type { ExpensePageData } from "@/src/app/(app)/despesas/_lib/types";
import { Badge } from "@/src/components/ui/badge";
import { buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

type ExpenseMonthPageProps = {
    data: ExpensePageData;
};

function formatCurrency(value: string) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(value));
}

function SummaryStat({ icon: Icon, title, value, description }: { icon: LucideIcon; title: string; value: string | number; description: string }) {
    return (
        <Card size="sm" className="min-w-0">
            <CardHeader>
                <CardDescription>{title}</CardDescription>
                <CardTitle className="text-2xl">{value}</CardTitle>
                <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end text-muted-foreground">
                    <Icon aria-hidden="true" />
                </div>
                <CardDescription className="text-xs">{description}</CardDescription>
            </CardHeader>
        </Card>
    );
}

export function ExpenseMonthPage({ data }: ExpenseMonthPageProps) {
    const canAssociateMember = data.members.length < 2;

    return (
        <section className="mx-auto w-full max-w-7xl flex flex-col gap-8">
            <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="flex flex-col items-start gap-2">
                    <Badge variant="secondary">Despesas</Badge>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Despesas do casal</h1>
                    <p className="max-w-2xl text-base text-muted-foreground">
                        Acompanhe os lançamentos de {data.householdName} agrupados por área e subcategoria.
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <MonthNavigation month={data.month} />
                    <Link href="/despesas/importar" className={buttonVariants({ variant: "secondary" })}>
                        <FileUpIcon data-icon="inline-start" aria-hidden="true" />
                        Importar arquivo
                    </Link>
                    <Link href="/despesas/nova" className={buttonVariants()}>
                        <PlusIcon data-icon="inline-start" aria-hidden="true" />
                        Nova despesa
                    </Link>
                </div>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
                <SummaryStat icon={ReceiptTextIcon} title="Total do mês" value={formatCurrency(data.totalAmount)} description="Todos os lançamentos" />
                <SummaryStat icon={ScaleIcon} title="Compartilhadas" value={formatCurrency(data.sharedAmount)} description="Base para a divisão futura" />
                <SummaryStat icon={ListOrderedIcon} title="Lançamentos" value={data.expenses.length} description="Na competência selecionada" />
            </div>

            {canAssociateMember && (
                <Card className="border border-dashed border-primary/40 bg-primary/5 ring-0" data-testid="household-callout">
                    <CardHeader>
                        <CardTitle className="text-lg">Complete o household</CardTitle>
                        <CardDescription>Associe a conta da outra pessoa para poder atribuir cada despesa ao responsável correto.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <HouseholdMemberForm />
                    </CardContent>
                </Card>
            )}

            <section className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Lançamentos</h2>
                        <p className="text-sm text-muted-foreground">Organizados por categoria de área e subcategoria.</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{data.expenses.length} {data.expenses.length === 1 ? "item" : "itens"}</span>
                </div>
                <ExpenseTable expenses={data.expenses} />
            </section>
        </section>
    );
}

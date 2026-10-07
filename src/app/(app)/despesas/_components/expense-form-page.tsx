import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { ExpenseForm } from "@/src/app/(app)/despesas/_components/expense-form";
import { Badge } from "@/src/components/ui/badge";
import type { ExpenseFormValues } from "@/src/app/(app)/despesas/_lib/schemas";
import type { ExpenseOptions } from "@/src/app/(app)/despesas/_lib/types";

type ExpenseFormPageProps = {
    mode: "create" | "edit";
    expenseId?: string;
    householdName: string;
    options: ExpenseOptions;
    initialValues: ExpenseFormValues;
};

export function ExpenseFormPage({ mode, expenseId, householdName, options, initialValues }: ExpenseFormPageProps) {
    const isEdit = mode === "edit";

    return (
        <section className="mx-auto w-full max-w-7xl flex flex-col gap-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col items-start gap-2">
                    <Link href="/despesas" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                        <ArrowLeftIcon className="size-4" aria-hidden="true" />
                        Voltar para despesas
                    </Link>
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary">Despesas</Badge>
                        <span className="text-sm text-muted-foreground">{isEdit ? "Edição" : "Novo lançamento"}</span>
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        {isEdit ? "Editar despesa" : "Nova despesa"}
                    </h1>
                    <p className="max-w-2xl text-base text-muted-foreground">
                        {isEdit ? "Atualize os dados deste lançamento do household." : "Registre uma saída e classifique como ela participa do mês."}
                    </p>
                </div>
            </header>

            <ExpenseForm
                expenseId={expenseId}
                options={options}
                initialValues={initialValues}
                householdName={householdName}
            />
        </section>
    );
}

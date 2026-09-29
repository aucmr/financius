import { Fragment } from "react";
import Link from "next/link";

import { DeleteExpenseButton } from "@/src/app/(app)/despesas/_components/delete-expense-button";
import type { ExpenseListItem } from "@/src/app/(app)/despesas/_lib/types";

type ExpenseTableProps = {
    expenses: ExpenseListItem[];
};

function formatCurrency(value: string) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(value));
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
    }).format(new Date(`${value}T00:00:00.000Z`));
}

function groupExpenses(expenses: ExpenseListItem[]) {
    const groups = new Map<
        string,
        {
            name: string;
            color: string;
            subcategories: Map<string, { name: string; expenses: ExpenseListItem[] }>;
        }
    >();

    for (const expense of expenses) {
        const area = groups.get(expense.areaCategory.id) ?? {
            name: expense.areaCategory.name,
            color: expense.areaCategory.color,
            subcategories: new Map(),
        };
        const subcategory = area.subcategories.get(expense.areaSubcategory.id) ?? {
            name: expense.areaSubcategory.name,
            expenses: [],
        };

        subcategory.expenses.push(expense);
        area.subcategories.set(expense.areaSubcategory.id, subcategory);
        groups.set(expense.areaCategory.id, area);
    }

    return groups;
}

export function ExpenseTable({ expenses }: ExpenseTableProps) {
    if (expenses.length === 0) {
        return (
            <div className="card bg-base-100 shadow-md">
                <div className="card-body min-h-72 items-center justify-center gap-3 px-6 text-center">
                    <span className="icon-[tabler--receipt-off] size-11 text-primary/60" aria-hidden="true" />
                    <div className="space-y-1">
                        <h2 className="font-semibold text-base-content">Nenhuma despesa neste mês</h2>
                        <p className="text-sm text-base-content/60">
                            Registre o primeiro lançamento para começar a acompanhar esta competência.
                        </p>
                    </div>
                    <Link href="/despesas/nova" className="btn btn-primary btn-sm mt-2 gap-2">
                        <span className="icon-[tabler--plus] size-4" aria-hidden="true" />
                        Nova despesa
                    </Link>
                </div>
            </div>
        );
    }

    const groups = groupExpenses(expenses);

    return (
        <div className="card bg-base-100 shadow-md">
            <div className="card-body overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="table min-w-215">
                        <thead>
                            <tr className="text-xs uppercase tracking-[0.08em] text-base-content/50">
                                <th>Data</th>
                                <th>Descrição</th>
                                <th>Perfil</th>
                                <th>Responsável</th>
                                <th className="text-right">Valor</th>
                                <th className="w-24 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from(groups.entries()).map(([areaId, area]) => {
                                const areaTotal = Array.from(area.subcategories.values()).reduce(
                                    (total, subcategory) =>
                                        total + subcategory.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
                                    0,
                                );

                                return (
                                    <Fragment key={areaId}>
                                        <tr className="bg-base-200/60">
                                            <th colSpan={4} className="text-sm font-semibold text-base-content">
                                                <span
                                                    className="me-2 inline-block size-2 rounded-full align-middle"
                                                    style={{ backgroundColor: area.color }}
                                                    aria-hidden="true"
                                                />
                                                {area.name}
                                            </th>
                                            <th className="text-right text-sm font-semibold text-base-content">
                                                {formatCurrency(areaTotal.toFixed(2))}
                                            </th>
                                            <th />
                                        </tr>
                                        {Array.from(area.subcategories.entries()).map(([subcategoryId, subcategory]) => {
                                            const subcategoryTotal = subcategory.expenses.reduce(
                                                (sum, expense) => sum + Number(expense.amount),
                                                0,
                                            );

                                            return (
                                                <Fragment key={subcategoryId}>
                                                    <tr key={`${subcategoryId}-header`} className="bg-base-200/30">
                                                        <th colSpan={4} className="py-2 text-xs font-semibold text-base-content/60">
                                                            <span className="ms-2">{subcategory.name}</span>
                                                        </th>
                                                        <th className="py-2 text-right text-xs font-semibold text-base-content/60">
                                                            {formatCurrency(subcategoryTotal.toFixed(2))}
                                                        </th>
                                                        <th />
                                                    </tr>
                                                    {subcategory.expenses.map((expense) => (
                                                        <tr key={expense.id}>
                                                            <td className="whitespace-nowrap text-sm text-base-content/65">
                                                                {formatDate(expense.date)}
                                                            </td>
                                                            <td>
                                                                <div className="flex min-w-52 flex-col gap-1">
                                                                    <span className="font-medium text-base-content">
                                                                        {expense.description}
                                                                    </span>
                                                                    <span className="flex flex-wrap gap-1">
                                                                        {expense.importSource && (
                                                                            <span className="badge badge-soft badge-info badge-xs">
                                                                                Importada {expense.importSource}
                                                                            </span>
                                                                        )}
                                                                        {expense.shared && (
                                                                            <span className="badge badge-soft badge-primary badge-xs">
                                                                                Compartilhada
                                                                            </span>
                                                                        )}
                                                                        {expense.recurring && (
                                                                            <span className="badge badge-soft badge-secondary badge-xs">
                                                                                Recorrente
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                    {expense.creditCardTransactionDate && (
                                                                        <span className="text-xs text-base-content/50">
                                                                            Compra em {formatDate(expense.creditCardTransactionDate)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="text-sm text-base-content/65">
                                                                {expense.profileCategory.name}
                                                            </td>
                                                            <td className="text-sm text-base-content/65">
                                                                {expense.responsibleUser.name}
                                                            </td>
                                                            <td className="whitespace-nowrap text-right font-semibold text-base-content">
                                                                {formatCurrency(expense.amount)}
                                                            </td>
                                                            <td>
                                                                <div className="flex justify-end gap-1">
                                                                    <Link
                                                                        href={`/despesas/${expense.id}/editar`}
                                                                        className="btn btn-soft btn-secondary btn-square btn-sm"
                                                                        aria-label={`Editar ${expense.description}`}
                                                                        title="Editar despesa"
                                                                    >
                                                                        <span className="icon-[tabler--pencil] size-4" aria-hidden="true" />
                                                                    </Link>
                                                                    <DeleteExpenseButton
                                                                        expenseId={expense.id}
                                                                        description={expense.description}
                                                                    />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </Fragment>
                                            );
                                        })}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

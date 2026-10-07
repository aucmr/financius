import { PencilIcon, PlusIcon, ReceiptTextIcon } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

import { DeleteExpenseButton } from "@/src/app/(app)/despesas/_components/delete-expense-button";
import type { ExpenseListItem } from "@/src/app/(app)/despesas/_lib/types";
import { Badge } from "@/src/components/ui/badge";
import { buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/src/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";

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
            <Card>
                <CardContent>
                    <Empty className="min-h-72">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <ReceiptTextIcon aria-hidden="true" />
                            </EmptyMedia>
                            <EmptyTitle>Nenhuma despesa neste mês</EmptyTitle>
                            <EmptyDescription>
                                Registre o primeiro lançamento para começar a acompanhar esta competência.
                            </EmptyDescription>
                        </EmptyHeader>
                        <Link href="/despesas/nova" className={buttonVariants({ size: "sm" })}>
                            <PlusIcon data-icon="inline-start" aria-hidden="true" />
                            Nova despesa
                        </Link>
                    </Empty>
                </CardContent>
            </Card>
        );
    }

    const groups = groupExpenses(expenses);

    return (
        <Card>
            <CardContent className="overflow-hidden p-0">
                <Table className="min-w-215">
                    <TableHeader>
                        <TableRow className="text-xs uppercase tracking-[0.08em]">
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Perfil</TableHead>
                            <TableHead>Responsável</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="w-24 text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from(groups.entries()).map(([areaId, area]) => {
                            const areaTotal = Array.from(area.subcategories.values()).reduce(
                                (total, subcategory) =>
                                    total + subcategory.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
                                0,
                            );

                            return (
                                <Fragment key={areaId}>
                                    <TableRow className="bg-muted/60 hover:bg-muted/60">
                                        <TableHead colSpan={4} className="text-sm font-semibold text-foreground">
                                            <span
                                                className="me-2 inline-block size-2 rounded-full align-middle"
                                                style={{ backgroundColor: area.color }}
                                                aria-hidden="true"
                                            />
                                            {area.name}
                                        </TableHead>
                                        <TableHead className="text-right text-sm font-semibold text-foreground">
                                            {formatCurrency(areaTotal.toFixed(2))}
                                        </TableHead>
                                        <TableHead />
                                    </TableRow>
                                    {Array.from(area.subcategories.entries()).map(([subcategoryId, subcategory]) => {
                                        const subcategoryTotal = subcategory.expenses.reduce(
                                            (sum, expense) => sum + Number(expense.amount),
                                            0,
                                        );

                                        return (
                                            <Fragment key={subcategoryId}>
                                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                    <TableHead colSpan={4} className="text-xs font-semibold text-muted-foreground">
                                                        <span className="ms-2">{subcategory.name}</span>
                                                    </TableHead>
                                                    <TableHead className="text-right text-xs font-semibold text-muted-foreground">
                                                        {formatCurrency(subcategoryTotal.toFixed(2))}
                                                    </TableHead>
                                                    <TableHead />
                                                </TableRow>
                                                {subcategory.expenses.map((expense) => (
                                                    <TableRow key={expense.id}>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {formatDate(expense.date)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex min-w-52 flex-col gap-1">
                                                                <span className="font-medium text-foreground">
                                                                    {expense.description}
                                                                </span>
                                                                <span className="flex flex-wrap gap-1">
                                                                    {expense.importSource && (
                                                                        <Badge variant="outline">Importada {expense.importSource}</Badge>
                                                                    )}
                                                                    {expense.shared && <Badge variant="secondary">Compartilhada</Badge>}
                                                                    {expense.recurring && <Badge variant="outline">Recorrente</Badge>}
                                                                </span>
                                                                {expense.creditCardTransactionDate && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Compra em {formatDate(expense.creditCardTransactionDate)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {expense.profileCategory.name}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {expense.responsibleUser.name}
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold text-foreground">
                                                            {formatCurrency(expense.amount)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex justify-end gap-1">
                                                                <Link
                                                                    href={`/despesas/${expense.id}/editar`}
                                                                    className={buttonVariants({ variant: "secondary", size: "icon-sm" })}
                                                                    aria-label={`Editar ${expense.description}`}
                                                                    title="Editar despesa"
                                                                >
                                                                    <PencilIcon aria-hidden="true" />
                                                                </Link>
                                                                <DeleteExpenseButton
                                                                    expenseId={expense.id}
                                                                    description={expense.description}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </Fragment>
                                        );
                                    })}
                                </Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

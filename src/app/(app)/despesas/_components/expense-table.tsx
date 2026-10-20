"use client";

import { Fragment, useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { ChevronRightIcon, PencilIcon, PlusIcon, ReceiptTextIcon } from "lucide-react";

import { DeleteExpenseButton } from "@/src/app/(app)/despesas/_components/delete-expense-button";
import type { ExpenseListItem } from "@/src/app/(app)/despesas/_lib/types";
import { CategoryIcon } from "@/src/components/category-icon";
import { Badge } from "@/src/components/ui/badge";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/src/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { cn } from "@/src/lib/utils/cn";

type ExpenseTableProps = {
    expenses: ExpenseListItem[];
};

type ExpenseSubcategoryGroup = {
    name: string;
    expenses: ExpenseListItem[];
};

type ExpenseCategoryGroup = {
    name: string;
    color: string;
    icon: string | null;
    sortOrder: number;
    isArchived: boolean;
    subcategories: Map<string, ExpenseSubcategoryGroup>;
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
    const groups = new Map<string, ExpenseCategoryGroup>();

    for (const expense of expenses) {
        const area = groups.get(expense.areaCategory.id) ?? {
            name: expense.areaCategory.name,
            color: expense.areaCategory.color,
            icon: expense.areaCategory.icon,
            sortOrder: expense.areaCategory.sortOrder,
            isArchived: expense.areaCategory.isArchived,
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

function getOrderedCategoryGroups(groups: Map<string, ExpenseCategoryGroup>) {
      return Array.from(groups.entries()).sort(([, left], [, right]) =>
          Number(left.isArchived) - Number(right.isArchived) ||
          left.sortOrder - right.sortOrder ||
          left.name.localeCompare(right.name, "pt-BR"),
      );
}

function getOrderedSubcategoryGroups(area: ExpenseCategoryGroup) {
      return Array.from(area.subcategories.entries()).sort(([, left], [, right]) =>
          left.name.localeCompare(right.name, "pt-BR"),
      );
}

function getExpenseTotal(expenses: ExpenseListItem[]) {
    return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
}

function getCategoryTotal(area: ExpenseCategoryGroup) {
    return Array.from(area.subcategories.values()).reduce(
        (total, subcategory) => total + getExpenseTotal(subcategory.expenses),
        0,
    );
}

function toggleExpanded(
    setExpanded: Dispatch<SetStateAction<ReadonlySet<string>>>,
    key: string,
) {
    setExpanded((current) => {
        const next = new Set(current);

        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }

        return next;
    });
}

function ExpenseBadges({ expense }: { expense: ExpenseListItem }) {
    if (!expense.importSource && !expense.shared && !expense.recurring) {
        return null;
    }

    return (
        <span className="flex flex-wrap gap-1">
            {expense.importSource && (
                <Badge variant="outline">Importada {expense.importSource}</Badge>
            )}
            {expense.shared && <Badge variant="secondary">Compartilhada</Badge>}
            {expense.recurring && <Badge variant="outline">Recorrente</Badge>}
        </span>
    );
}

function ExpenseActions({ expense }: { expense: ExpenseListItem }) {
    return (
        <div className="flex justify-end gap-1">
            <Link
                href={`/despesas/${expense.id}/editar`}
                className={buttonVariants({ variant: "secondary", size: "icon-sm" })}
                aria-label={`Editar ${expense.description}`}
                title="Editar despesa"
            >
                <PencilIcon aria-hidden="true" />
            </Link>
            <DeleteExpenseButton expenseId={expense.id} description={expense.description} />
        </div>
    );
}

export function ExpenseTable({ expenses }: ExpenseTableProps) {
    const [expandedCategories, setExpandedCategories] = useState<ReadonlySet<string>>(
        () => new Set(),
    );
    const [expandedSubcategories, setExpandedSubcategories] = useState<ReadonlySet<string>>(
        () => new Set(),
    );

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
    const orderedGroups = getOrderedCategoryGroups(groups);

    return (
        <Card>
            <CardContent className="overflow-hidden p-0">
                <div className="hidden xl:block" role="region" aria-label="Tabela de lançamentos">
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
                            {orderedGroups.map(([areaId, area]) => {
                                const areaTotal = getCategoryTotal(area);
                                const areaExpanded = expandedCategories.has(areaId);

                                return (
                                    <Fragment key={areaId}>
                                        <TableRow className="bg-muted/60 hover:bg-muted/60">
                                            <TableHead colSpan={4} className="py-1 text-sm font-semibold text-foreground">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="w-full justify-start"
                                                    aria-expanded={areaExpanded}
                                                    aria-label={`${areaExpanded ? "Recolher" : "Expandir"} categoria ${area.name}`}
                                                    onClick={() => toggleExpanded(setExpandedCategories, areaId)}
                                                >
                                                    <ChevronRightIcon
                                                        data-icon="inline-start"
                                                        className={cn("transition-transform", areaExpanded && "rotate-90")}
                                                        aria-hidden="true"
                                                    />
                                                    <CategoryIcon
                                                        name={area.icon}
                                                        data-icon="inline-start"
                                                        style={{ color: area.color }}
                                                        aria-hidden="true"
                                                    />
                                                    {area.name}
                                                </Button>
                                            </TableHead>
                                            <TableHead className="text-right text-sm font-semibold text-foreground">
                                                {formatCurrency(areaTotal.toFixed(2))}
                                            </TableHead>
                                            <TableHead />
                                        </TableRow>
                                        {areaExpanded && getOrderedSubcategoryGroups(area).map(([subcategoryId, subcategory]) => {
                                            const subcategoryTotal = getExpenseTotal(subcategory.expenses);
                                            const subcategoryKey = `${areaId}:${subcategoryId}`;
                                            const subcategoryExpanded = expandedSubcategories.has(subcategoryKey);

                                            return (
                                                <Fragment key={subcategoryId}>
                                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                        <TableHead colSpan={4} className="py-1 text-xs font-semibold text-muted-foreground">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="ms-2 justify-start"
                                                                aria-expanded={subcategoryExpanded}
                                                                aria-label={`${subcategoryExpanded ? "Recolher" : "Expandir"} subcategoria ${subcategory.name}`}
                                                                onClick={() => toggleExpanded(setExpandedSubcategories, subcategoryKey)}
                                                            >
                                                                <ChevronRightIcon
                                                                    data-icon="inline-start"
                                                                    className={cn(
                                                                        "transition-transform",
                                                                        subcategoryExpanded && "rotate-90",
                                                                    )}
                                                                    aria-hidden="true"
                                                                />
                                                                {subcategory.name}
                                                            </Button>
                                                        </TableHead>
                                                        <TableHead className="text-right text-xs font-semibold text-muted-foreground">
                                                            {formatCurrency(subcategoryTotal.toFixed(2))}
                                                        </TableHead>
                                                        <TableHead />
                                                    </TableRow>
                                                    {subcategoryExpanded && subcategory.expenses.map((expense) => (
                                                        <TableRow key={expense.id}>
                                                            <TableCell className="text-sm text-muted-foreground">
                                                                {formatDate(expense.date)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex min-w-52 flex-col gap-1">
                                                                    <span className="font-medium text-foreground">
                                                                        {expense.description}
                                                                    </span>
                                                                    <ExpenseBadges expense={expense} />
                                                                    {expense.creditCardTransactionDate && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            Compra em {formatDate(expense.creditCardTransactionDate)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-sm text-muted-foreground">
                                                                <span className="flex items-center gap-2">
                                                                    <CategoryIcon
                                                                        name={expense.profileCategory.icon}
                                                                        className="size-4"
                                                                        style={{ color: expense.profileCategory.color }}
                                                                        aria-hidden="true"
                                                                    />
                                                                    {expense.profileCategory.name}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-sm text-muted-foreground">
                                                                {expense.responsibleUser.name}
                                                            </TableCell>
                                                            <TableCell className="text-right font-semibold text-foreground">
                                                                {formatCurrency(expense.amount)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <ExpenseActions expense={expense} />
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
                </div>

                <div
                    className="xl:hidden"
                    role="region"
                    aria-label="Lista compacta de lançamentos"
                >
                    <ul className="divide-y divide-border">
                        {orderedGroups.map(([areaId, area]) => {
                            const areaExpanded = expandedCategories.has(areaId);

                            return (
                                <li key={areaId}>
                                    <div className="flex items-center gap-3 bg-muted/60 px-4 py-2">
                                        <h3 className="min-w-0 flex-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="h-auto min-h-10 w-full justify-start whitespace-normal px-0 text-left"
                                                aria-expanded={areaExpanded}
                                                aria-label={`${areaExpanded ? "Recolher" : "Expandir"} categoria ${area.name}`}
                                                onClick={() => toggleExpanded(setExpandedCategories, areaId)}
                                            >
                                                <ChevronRightIcon
                                                    data-icon="inline-start"
                                                    className={cn("transition-transform", areaExpanded && "rotate-90")}
                                                    aria-hidden="true"
                                                />
                                                <CategoryIcon
                                                    name={area.icon}
                                                    data-icon="inline-start"
                                                    style={{ color: area.color }}
                                                    aria-hidden="true"
                                                />
                                                <span className="min-w-0 break-words">{area.name}</span>
                                            </Button>
                                        </h3>
                                        <span className="shrink-0 text-sm font-semibold text-foreground">
                                            {formatCurrency(getCategoryTotal(area).toFixed(2))}
                                        </span>
                                    </div>
                                    {areaExpanded && (
                                        <ul className="divide-y divide-border">
                                            {getOrderedSubcategoryGroups(area).map(([subcategoryId, subcategory]) => {
                                                const subcategoryKey = `${areaId}:${subcategoryId}`;
                                                const subcategoryExpanded = expandedSubcategories.has(subcategoryKey);

                                                return (
                                                    <li key={subcategoryId}>
                                                        <div className="flex items-center gap-3 bg-muted/30 py-1 pe-4 ps-7 text-muted-foreground">
                                                            <h4 className="min-w-0 flex-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-auto min-h-10 w-full justify-start whitespace-normal px-0 text-left"
                                                                    aria-expanded={subcategoryExpanded}
                                                                    aria-label={`${subcategoryExpanded ? "Recolher" : "Expandir"} subcategoria ${subcategory.name}`}
                                                                    onClick={() => toggleExpanded(setExpandedSubcategories, subcategoryKey)}
                                                                >
                                                                    <ChevronRightIcon
                                                                        data-icon="inline-start"
                                                                        className={cn(
                                                                            "transition-transform",
                                                                            subcategoryExpanded && "rotate-90",
                                                                        )}
                                                                        aria-hidden="true"
                                                                    />
                                                                    <span className="min-w-0 break-words">
                                                                        {subcategory.name}
                                                                    </span>
                                                                </Button>
                                                            </h4>
                                                            <span className="shrink-0 text-xs font-semibold">
                                                                {formatCurrency(
                                                                    getExpenseTotal(subcategory.expenses).toFixed(2),
                                                                )}
                                                            </span>
                                                        </div>
                                                        {subcategoryExpanded && (
                                                            <ul className="divide-y divide-border">
                                                                {subcategory.expenses.map((expense) => (
                                                                    <li
                                                                        key={expense.id}
                                                                        className="flex flex-col gap-2 px-4 py-3"
                                                                    >
                                                                        <div className="flex items-start justify-between gap-3">
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {formatDate(expense.date)}
                                                                                </p>
                                                                                <p className="break-words text-sm font-medium text-foreground">
                                                                                    {expense.description}
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex shrink-0 flex-col items-end gap-1">
                                                                                <span className="whitespace-nowrap text-sm font-semibold text-foreground">
                                                                                    {formatCurrency(expense.amount)}
                                                                                </span>
                                                                                <ExpenseActions expense={expense} />
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                                            <span className="flex items-center gap-1">
                                                                                <CategoryIcon
                                                                                    name={expense.profileCategory.icon}
                                                                                    className="size-3.5"
                                                                                    style={{ color: expense.profileCategory.color }}
                                                                                    aria-hidden="true"
                                                                                />
                                                                                Perfil: {expense.profileCategory.name}
                                                                            </span>
                                                                            <span>
                                                                                Responsável: {expense.responsibleUser.name}
                                                                            </span>
                                                                        </div>
                                                                        <ExpenseBadges expense={expense} />
                                                                        {expense.creditCardTransactionDate && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                Compra em{" "}
                                                                                {formatDate(expense.creditCardTransactionDate)}
                                                                            </span>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}

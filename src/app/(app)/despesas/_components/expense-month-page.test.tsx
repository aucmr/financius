// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExpenseMonthPage } from "@/src/app/(app)/despesas/_components/expense-month-page";
import type { ExpensePageData } from "@/src/app/(app)/despesas/_lib/types";

vi.mock("next/link", () => ({
    default: ({
        children,
        ...props
    }: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>) => (
        <a {...props}>{children}</a>
    ),
}));

vi.mock("@/src/app/(app)/despesas/_components/household-member-form", () => ({
    HouseholdMemberForm: () => <div data-testid="household-member-form" />,
}));

vi.mock("@/src/app/(app)/despesas/_components/expense-table", () => ({
    ExpenseTable: () => <div data-testid="expense-table" />,
}));

vi.mock("@/src/app/(app)/despesas/_components/expense-distribution-charts", () => ({
    ExpenseDistributionCharts: ({
        areas,
        profiles,
    }: {
        areas: ExpensePageData["expenseDistribution"]["byArea"];
        profiles: ExpensePageData["expenseDistribution"]["byProfile"];
    }) => (
        <div
            data-testid="expense-distribution-charts"
            data-area-count={areas.length.toString()}
            data-profile-count={profiles.length.toString()}
        />
    ),
}));

vi.mock("@/src/app/(app)/despesas/_components/month-navigation", () => ({
    MonthNavigation: ({ month, showMonthPicker }: { month: string; showMonthPicker?: boolean }) => (
        <div data-testid="month-navigation" data-show-month-picker={showMonthPicker}>{month}</div>
    ),
}));

const members = [
    { id: "member-1", name: "Ana", email: "ana@example.com" },
    { id: "member-2", name: "Bruno", email: "bruno@example.com" },
];

const baseData: ExpensePageData = {
    month: "2026-07",
    householdName: "Ana e Bruno",
    currentUserId: "member-1",
    members,
    options: {
        areaCategories: [],
        profileCategories: [],
        members,
    },
    expenses: [],
    expenseDistribution: {
        byArea: [],
        byProfile: [],
    },
    importedStatements: {
        XP: true,
        BTG: false,
        BB: false,
    },
    totalAmount: "123.45",
    sharedAmount: "67.89",
};

afterEach(() => {
    cleanup();
});

describe("ExpenseMonthPage", () => {
    it("uses a responsive stats surface and keeps header controls outside it", () => {
        render(<ExpenseMonthPage data={baseData} />);

        const stats = screen.getByText("Total do mês").closest('[data-slot="card"]')?.parentElement;

        expect(stats).toHaveClass("grid", "sm:grid-cols-3");
        expect(screen.getByText("Total do mês")).toBeInTheDocument();
        expect(screen.getByText("Compartilhadas")).toBeInTheDocument();
        expect(stats).not.toHaveTextContent("Lançamentos");
        expect(stats).toHaveTextContent("Importações do mês");
        expect(stats).toHaveTextContent("XP");
        expect(stats).toHaveTextContent("Banco do Brasil");
        expect(stats).toHaveTextContent("Importada");
        expect(stats).toHaveTextContent("Não importada");
        expect(screen.getByTestId("month-navigation").closest('.grid.sm\\:grid-cols-3')).toBeNull();
        expect(screen.getByText("0 itens")).toBeInTheDocument();
        expect(screen.getByTestId("month-navigation")).toHaveAttribute("data-show-month-picker", "true");
        expect(screen.queryByText("Despesas", { exact: true })).not.toBeInTheDocument();

        const importLink = screen.getByRole("link", { name: "Importar arquivo" });
        const newExpenseLink = screen.getByRole("link", { name: "Nova despesa" });
        const actions = screen.getByRole("group", { name: "Ações de despesas" });

        expect(actions).toContainElement(importLink);
        expect(actions).toContainElement(newExpenseLink);
        expect(importLink.className).toBe(newExpenseLink.className);
    });

    it("places the selected-month distribution charts before the expense list", () => {
        render(<ExpenseMonthPage data={baseData} />);

        const chartSection = screen.getByRole("region", {
            name: "Composição das despesas",
        });
        const charts = screen.getByTestId("expense-distribution-charts");
        const expenseTable = screen.getByTestId("expense-table");

        expect(chartSection).toContainElement(charts);
        expect(charts).toHaveAttribute("data-area-count", "0");
        expect(charts).toHaveAttribute("data-profile-count", "0");
        expect(
            chartSection.compareDocumentPosition(expenseTable) &
                Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });

    it("shows the household callout when a second member is missing", () => {
        render(
            <ExpenseMonthPage
                data={{
                    ...baseData,
                    members: [members[0]],
                    options: { ...baseData.options, members: [members[0]] },
                }}
            />,
        );

        const callout = screen.getByTestId("household-callout");

        expect(callout).toHaveClass("border-dashed");
        expect(screen.getByTestId("household-member-form")).toBeInTheDocument();
    });
});

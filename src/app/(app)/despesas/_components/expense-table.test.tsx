// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes, PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExpenseTable } from "@/src/app/(app)/despesas/_components/expense-table";
import type { ExpenseListItem } from "@/src/app/(app)/despesas/_lib/types";

vi.mock("next/link", () => ({
    default: ({
        children,
        ...props
    }: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>) => (
        <a {...props}>{children}</a>
    ),
}));

vi.mock("@/src/app/(app)/despesas/_components/delete-expense-button", () => ({
    DeleteExpenseButton: ({ description }: { expenseId: string; description: string }) => (
        <button type="button" aria-label={`Excluir ${description}`}>
            Excluir
        </button>
    ),
}));

const expense: ExpenseListItem = {
    id: "expense-1",
    description: "Mercado da semana",
    amount: "120.50",
    date: "2026-07-12",
    notes: null,
    recurring: false,
    shared: true,
    areaCategory: {
        id: "area-1",
        name: "Casa",
        color: "#2f855a",
        icon: null,
        sortOrder: 0,
        isArchived: false,
    },
    areaSubcategory: {
        id: "subcategory-1",
        name: "Mercado",
    },
    profileCategory: {
        id: "profile-1",
        name: "CustoFixo",
        color: "#0000ff",
        icon: null,
    },
    creator: {
        id: "member-1",
        name: "Ana",
    },
    responsibleUser: {
        id: "member-1",
        name: "Ana",
    },
};

afterEach(() => {
    cleanup();
});

describe("ExpenseTable", () => {
    it("renders the empty state as a card body", () => {
        const { container } = render(<ExpenseTable expenses={[]} />);
        const card = container.querySelector('[data-slot="card"]');

        expect(card).toBeInTheDocument();
        expect(card?.querySelector('[data-slot="card-content"]')).toBeInTheDocument();
        expect(screen.getByText("Nenhuma despesa neste mês")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Nova despesa" })).toBeInTheDocument();
    });

    it("keeps the desktop table and mobile list in one card with shared disclosure state", () => {
        const { container } = render(<ExpenseTable expenses={[expense]} />);
        const desktopView = screen.getByRole("region", { name: "Tabela de lançamentos" });
        const mobileView = screen.getByRole("region", { name: "Lista compacta de lançamentos" });
        const table = within(desktopView).getByRole("table");
        const tableSurface = table.parentElement;
        const card = table.closest('[data-slot="card"]');
        const categoryToggle = within(mobileView).getByRole("button", {
            name: "Expandir categoria Casa",
        });

        expect(tableSurface).toHaveClass("overflow-x-auto");
        expect(desktopView).toHaveClass("hidden", "xl:block");
        expect(mobileView).toHaveClass("xl:hidden");
        expect(card).toBeInTheDocument();
        expect(card?.querySelector('[data-slot="card-content"]')).toHaveClass("overflow-hidden", "p-0");
        expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(1);
        expect(within(mobileView).getByText("Casa")).toBeInTheDocument();
        expect(categoryToggle).toHaveAttribute("aria-expanded", "false");
        expect(within(mobileView).queryByText("Mercado")).not.toBeInTheDocument();
        expect(
            within(mobileView).queryByRole("link", { name: "Editar Mercado da semana" }),
        ).not.toBeInTheDocument();

        fireEvent.click(categoryToggle);

        const subcategoryToggle = within(mobileView).getByRole("button", {
            name: "Expandir subcategoria Mercado",
        });

        expect(categoryToggle).toHaveAttribute("aria-expanded", "true");
        expect(
            within(desktopView).getByRole("button", { name: "Recolher categoria Casa" }),
        ).toHaveAttribute("aria-expanded", "true");
        expect(subcategoryToggle).toHaveAttribute("aria-expanded", "false");
        expect(within(mobileView).getByText("Mercado")).toBeInTheDocument();
        expect(
            within(mobileView).queryByRole("link", { name: "Editar Mercado da semana" }),
        ).not.toBeInTheDocument();

        fireEvent.click(subcategoryToggle);

        expect(
            within(mobileView).getByRole("link", { name: "Editar Mercado da semana" }),
        ).toBeInTheDocument();
        expect(
            within(mobileView).getByRole("button", { name: "Excluir Mercado da semana" }),
        ).toBeInTheDocument();
        expect(
            within(desktopView).getByRole("link", { name: "Editar Mercado da semana" }),
        ).toBeInTheDocument();
        expect(
            within(desktopView).getByRole("button", { name: "Excluir Mercado da semana" }),
        ).toBeInTheDocument();
        expect(within(desktopView).getByText("CustoFixo")).toBeInTheDocument();
        expect(within(desktopView).getByText("Ana")).toBeInTheDocument();
        expect(within(mobileView).getByText("Perfil: CustoFixo")).toBeInTheDocument();
        expect(within(mobileView).getByText("Responsável: Ana")).toBeInTheDocument();
        expect(within(mobileView).getByText("Compartilhada")).toBeInTheDocument();
        expect(within(mobileView).getByText("12/07")).toBeInTheDocument();
    });

    it("orders category groups by their household order", () => {
        const secondExpense: ExpenseListItem = {
            ...expense,
            id: "expense-2",
            description: "Conta de luz",
            areaCategory: {
                id: "area-2",
                name: "Alimentação",
                color: "#d97706",
                icon: null,
                sortOrder: 1,
                isArchived: false,
            },
        };
        const archivedExpense: ExpenseListItem = {
            ...expense,
            id: "expense-3",
            description: "Despesa antiga",
            areaCategory: {
                ...expense.areaCategory,
                id: "area-archived",
                name: "Antiga",
                isArchived: true,
            },
        };
        render(
            <ExpenseTable
                expenses={[
                    secondExpense,
                    {
                        ...expense,
                        areaCategory: { ...expense.areaCategory, sortOrder: 0 },
                    },
                    archivedExpense,
                ]}
            />,
        );
        const mobileView = within(
            screen.getByRole("region", { name: "Lista compacta de lançamentos" }),
        );
        const categoryButtons = mobileView.getAllByRole("button", {
            name: /Expandir categoria/,
        });

        expect(categoryButtons.map((button) => button.getAttribute("aria-label"))).toEqual([
            "Expandir categoria Casa",
            "Expandir categoria Alimentação",
            "Expandir categoria Antiga",
        ]);
    });
});

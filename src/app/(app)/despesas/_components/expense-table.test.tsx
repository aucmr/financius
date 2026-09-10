// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
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
    },
    areaSubcategory: {
        id: "subcategory-1",
        name: "Mercado",
    },
    profileCategory: {
        id: "profile-1",
        name: "CustoFixo",
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
        const card = container.querySelector(".card");

        expect(card).toHaveClass("card", "bg-base-100", "shadow-md");
        expect(card?.querySelector(".card-body")).toBeInTheDocument();
        expect(screen.getByText("Nenhuma despesa neste mês")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Nova despesa" })).toBeInTheDocument();
    });

    it("renders populated rows inside a card without wrapping each row", () => {
        const { container } = render(<ExpenseTable expenses={[expense]} />);
        const table = screen.getByRole("table");
        const tableSurface = table.parentElement;
        const card = table.closest(".card");

        expect(tableSurface).toHaveClass("overflow-x-auto");
        expect(card).toHaveClass("card", "bg-base-100", "shadow-md");
        expect(card?.querySelector(".card-body")).toHaveClass("overflow-hidden", "p-0");
        expect(container.querySelectorAll(".card")).toHaveLength(1);
        expect(screen.getByText("Casa")).toBeInTheDocument();
        expect(screen.getByText("Mercado")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Editar Mercado da semana" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Excluir Mercado da semana" })).toBeInTheDocument();
    });
});

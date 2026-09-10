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

vi.mock("@/src/app/(app)/despesas/_components/month-navigation", () => ({
    MonthNavigation: ({ month }: { month: string }) => (
        <div data-testid="month-navigation">{month}</div>
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
    totalAmount: "123.45",
    sharedAmount: "67.89",
};

afterEach(() => {
    cleanup();
});

describe("ExpenseMonthPage", () => {
    it("uses a responsive stats surface and keeps header controls outside it", () => {
        render(<ExpenseMonthPage data={baseData} />);

        const stats = document.querySelector(".stats");

        expect(stats).toHaveClass(
            "stats-vertical",
            "w-full",
            "bg-base-100",
            "shadow-md",
            "lg:stats-horizontal",
        );
        expect(stats).not.toHaveClass("grid");
        expect(screen.getByText("Total do mês")).toBeInTheDocument();
        expect(screen.getByText("Compartilhadas")).toBeInTheDocument();
        expect(stats).toHaveTextContent("Lançamentos");
        expect(screen.getByTestId("month-navigation").closest(".stats")).toBeNull();
        expect(screen.getByRole("link", { name: "Nova despesa" })).toBeInTheDocument();
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

        const callout = screen.getByRole("heading", { name: "Complete o household" }).closest("section");

        expect(callout).toHaveClass("card", "border-dashed");
        expect(screen.getByTestId("household-member-form")).toBeInTheDocument();
    });
});

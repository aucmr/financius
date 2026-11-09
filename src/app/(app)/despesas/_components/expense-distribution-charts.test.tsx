// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ExpenseDistributionCharts } from "@/src/app/(app)/despesas/_components/expense-distribution-charts";
import type { ExpenseCategoryTotal } from "@/src/app/(app)/despesas/_lib/types";

afterEach(() => {
  cleanup();
});

describe("ExpenseDistributionCharts", () => {
  it("shows each category amount and share in both distributions", () => {
    const areas: ExpenseCategoryTotal[] = [
      { id: "food", name: "Alimentação", color: "#123456", amount: 150 },
      { id: "home", name: "Moradia", color: "#654321", amount: 50 },
    ];
    const profiles: ExpenseCategoryTotal[] = [
      { id: "shared", name: "Compartilhado", color: "#234567", amount: 100 },
      { id: "individual", name: "Individual", color: "#765432", amount: 100 },
    ];

    render(
      <ExpenseDistributionCharts areas={areas} profiles={profiles} />,
    );

    expect(screen.getByText("Despesas por área")).toBeInTheDocument();
    expect(screen.getByText("Despesas por perfil")).toBeInTheDocument();
    expect(screen.getByText("Alimentação")).toBeInTheDocument();
    expect(screen.getByText("Moradia")).toBeInTheDocument();
    expect(screen.getByText("Compartilhado")).toBeInTheDocument();
    expect(screen.getByText("Individual")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getAllByText("50%")).toHaveLength(2);
    expect(screen.getAllByText(/150,00/)).toHaveLength(1);
  });

  it("shows an empty state for each distribution without expenses", () => {
    render(<ExpenseDistributionCharts areas={[]} profiles={[]} />);

    expect(
      screen.getAllByText("Sem despesas nesta competência"),
    ).toHaveLength(2);
  });
});

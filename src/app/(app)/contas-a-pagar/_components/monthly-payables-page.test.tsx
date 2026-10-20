// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { setMonthlyPayableStatusAction } = vi.hoisted(() => ({
  setMonthlyPayableStatusAction: vi.fn(),
}));

vi.mock("@/src/app/(app)/contas-a-pagar/actions", () => ({
  setMonthlyPayableStatusAction,
}));

import { MonthlyPayablesPage } from "@/src/app/(app)/contas-a-pagar/_components/monthly-payables-page";
import { DEFAULT_PAYABLE_ITEMS } from "@/src/app/(app)/contas-a-pagar/_lib/repository";
import type { PayableChecklistPageData } from "@/src/app/(app)/contas-a-pagar/_lib/types";

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a {...props}>{children}</a>
  ),
}));

const itemNames = [
  "condominio",
  "cartão XP",
  "cartão PicPay",
  "cartão BTG",
  "cemig sim",
  "iptu",
  "ipva moto",
  "ipva kicks",
  "ipva march",
  "cofrinho felipe",
  "cofrinho leo",
  "coinha",
  "momo me pagou",
];

const baseData: PayableChecklistPageData = {
  month: "2026-10",
  householdName: "Pessoa 1 e Pessoa 2",
  items: itemNames.map((name, index) => ({
    id: `item-${index}`,
    name,
    isPaid: index === 0,
  })),
  paidCount: 1,
  pendingCount: 12,
};

afterEach(() => {
  cleanup();
});

describe("MonthlyPayablesPage", () => {
  it("shows the shared checklist, counts, all supplied items, and month navigation", () => {
    render(<MonthlyPayablesPage data={baseData} />);

    expect(DEFAULT_PAYABLE_ITEMS.map((item) => item.name)).toEqual(itemNames);
    expect(
      new Set(DEFAULT_PAYABLE_ITEMS.map((item) => item.defaultKey)).size,
    ).toBe(itemNames.length);
    expect(
      screen.getByRole("heading", { name: "Checklist mensal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Acompanhe os pagamentos compartilhados/),
    ).toHaveTextContent("Pessoa 1 e Pessoa 2");
    expect(screen.getByText("Pagas").parentElement).toHaveTextContent("1");
    expect(screen.getByText("Pendentes").parentElement).toHaveTextContent("12");

    for (const itemName of itemNames) {
      expect(
        screen.getByRole("checkbox", { name: itemName }),
      ).toBeInTheDocument();
    }

    expect(screen.getByRole("link", { name: "Mês anterior" })).toHaveAttribute(
      "href",
      "/contas-a-pagar?month=2026-09",
    );
    expect(
      screen.getByRole("link", { name: "Próximo mês" }),
    ).toHaveAttribute("href", "/contas-a-pagar?month=2026-11");
    expect(
      screen.getByRole("link", { name: "Gerenciar lista" }),
    ).toHaveAttribute("href", "/contas-a-pagar/gerenciar");
  });

  it("explains when the selected month has no registered items", () => {
    render(
      <MonthlyPayablesPage
        data={{
          ...baseData,
          items: [],
          paidCount: 0,
          pendingCount: 0,
        }}
      />,
    );

    expect(
      screen.getByText("Nenhum item nesta competência"),
    ).toBeInTheDocument();
  });
});

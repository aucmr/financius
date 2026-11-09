// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MonthNavigation } from "@/src/app/(app)/despesas/_components/month-navigation";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MonthNavigation", () => {
  it("keeps arrow navigation and allows direct month selection", () => {
    render(<MonthNavigation month="2026-11" showMonthPicker />);

    const monthInput = screen.getByLabelText("Competência");

    expect(monthInput).toHaveAttribute("type", "month");
    expect(monthInput).toHaveValue("2026-11");
    expect(screen.queryByRole("button", { name: "Aplicar" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mês anterior" })).toHaveAttribute(
      "href",
      "/despesas?month=2026-10",
    );
    expect(screen.getByRole("link", { name: "Próximo mês" })).toHaveAttribute(
      "href",
      "/despesas?month=2026-12",
    );
  });

  it("applies the selected month automatically", () => {
    render(<MonthNavigation month="2026-11" showMonthPicker />);

    fireEvent.change(screen.getByLabelText("Competência"), {
      target: { value: "2026-12" },
    });

    expect(mocks.push).toHaveBeenCalledWith("/despesas?month=2026-12", {
      scroll: false,
    });
  });

  it("updates the selected month after navigation", () => {
    const { rerender } = render(
      <MonthNavigation month="2026-10" showMonthPicker />,
    );

    expect(screen.getByLabelText("Competência")).toHaveValue("2026-10");

    rerender(<MonthNavigation month="2026-11" showMonthPicker />);

    expect(screen.getByLabelText("Competência")).toHaveValue("2026-11");
  });

  it("preserves the compact month label when no picker is requested", () => {
    render(
      <MonthNavigation month="2026-11" basePath="/contas-a-pagar" />,
    );

    expect(screen.getByText("novembro de 2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mês anterior" })).toHaveAttribute(
      "href",
      "/contas-a-pagar?month=2026-10",
    );
    expect(screen.queryByLabelText("Competência")).not.toBeInTheDocument();
  });
});

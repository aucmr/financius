// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { setMonthlyPayableStatusAction } = vi.hoisted(() => ({
  setMonthlyPayableStatusAction: vi.fn(),
}));

vi.mock("@/src/app/(app)/contas-a-pagar/actions", () => ({
  setMonthlyPayableStatusAction,
}));

import { PayableStatusCheckbox } from "@/src/app/(app)/contas-a-pagar/_components/payable-status-checkbox";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PayableStatusCheckbox", () => {
  it("saves the checked state for the selected item and month", async () => {
    setMonthlyPayableStatusAction.mockResolvedValue({
      ok: true,
      message: "Item marcado como pago.",
    });
    render(
      <PayableStatusCheckbox
        itemId="condominio-id"
        itemName="condominio"
        month="2026-10"
        initiallyPaid={false}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "condominio" }));

    await waitFor(() =>
      expect(setMonthlyPayableStatusAction).toHaveBeenCalledWith({
        itemId: "condominio-id",
        month: "2026-10",
        isPaid: true,
      }),
    );
    expect(
      screen.getByRole("checkbox", { name: "condominio" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("keeps the item pending when the server rejects the update", async () => {
    setMonthlyPayableStatusAction.mockResolvedValue({
      ok: false,
      message: "Item indisponível.",
    });
    render(
      <PayableStatusCheckbox
        itemId="condominio-id"
        itemName="condominio"
        month="2026-10"
        initiallyPaid={false}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "condominio" });
    fireEvent.click(checkbox);

    await waitFor(() =>
      expect(setMonthlyPayableStatusAction).toHaveBeenCalledWith({
        itemId: "condominio-id",
        month: "2026-10",
        isPaid: true,
      }),
    );
    expect(checkbox).toHaveAttribute("aria-checked", "false");
  });
});

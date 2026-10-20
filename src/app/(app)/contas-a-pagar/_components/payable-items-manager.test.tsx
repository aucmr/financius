// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { archivePayableItemAction, createPayableItemAction, movePayableItemAction, refresh, renamePayableItemAction } =
  vi.hoisted(() => ({
    archivePayableItemAction: vi.fn(),
    createPayableItemAction: vi.fn(),
    movePayableItemAction: vi.fn(),
    refresh: vi.fn(),
    renamePayableItemAction: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/src/app/(app)/contas-a-pagar/actions", () => ({
  archivePayableItemAction,
  createPayableItemAction,
  movePayableItemAction,
  renamePayableItemAction,
}));

import { PayableItemsManager } from "@/src/app/(app)/contas-a-pagar/_components/payable-items-manager";

const items = [
  { id: "condominio-id", name: "condominio", sortOrder: 0, archivedAt: null },
  { id: "xp-id", name: "cartão XP", sortOrder: 1, archivedAt: null },
  {
    id: "old-item-id",
    name: "conta antiga",
    sortOrder: 2,
    archivedAt: "2026-10-07T12:00:00.000Z",
  },
];

beforeEach(() => {
  archivePayableItemAction.mockResolvedValue({
    ok: true,
    message: "Item arquivado.",
  });
  createPayableItemAction.mockResolvedValue({
    ok: true,
    message: "Item adicionado.",
  });
  movePayableItemAction.mockResolvedValue({
    ok: true,
    message: "Ordem atualizada.",
  });
  renamePayableItemAction.mockResolvedValue({
    ok: true,
    message: "Item atualizado.",
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PayableItemsManager", () => {
  it("shows active and archived items and keeps ordering controls bounded", () => {
    render(<PayableItemsManager items={items} />);

    expect(screen.getByDisplayValue("condominio")).toBeInTheDocument();
    expect(screen.getByDisplayValue("cartão XP")).toBeInTheDocument();
    expect(screen.getByText("conta antiga")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mover condominio para cima" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Mover condominio para baixo" }),
    ).toBeEnabled();
  });

  it("adds and renames items through validated forms", async () => {
    render(<PayableItemsManager items={items} />);

    fireEvent.change(screen.getByPlaceholderText("Ex.: Internet"), {
      target: { value: "Internet" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar item" }));

    await waitFor(() =>
      expect(createPayableItemAction).toHaveBeenCalledWith({
        name: "Internet",
      }),
    );

    const nameInputs = screen.getAllByRole("textbox", { name: "Nome do item" });
    fireEvent.change(nameInputs[1], {
      target: { value: "Condomínio atualizado" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Salvar" })[0]);

    await waitFor(() =>
      expect(renamePayableItemAction).toHaveBeenCalledWith({
        itemId: "condominio-id",
        name: "Condomínio atualizado",
      }),
    );
  });

  it("moves and archives only after the corresponding actions succeed", async () => {
    render(<PayableItemsManager items={items} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Mover cartão XP para cima" }),
    );
    await waitFor(() =>
      expect(movePayableItemAction).toHaveBeenCalledWith({
        itemId: "xp-id",
        direction: "up",
      }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Mover cartão XP para cima" }),
      ).toBeEnabled(),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Arquivar condominio" }),
    );
    await waitFor(() =>
      expect(archivePayableItemAction).toHaveBeenCalledWith({
        itemId: "condominio-id",
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });
});

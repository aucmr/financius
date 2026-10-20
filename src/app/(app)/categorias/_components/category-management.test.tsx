// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CategoryManagement } from "@/src/app/(app)/categorias/_components/category-management";
import type { CategoryManagementPageData } from "@/src/app/(app)/categorias/_lib/types";

const mocks = vi.hoisted(() => ({
  archiveCategoryAction: vi.fn(),
  moveCategoryAction: vi.fn(),
  restoreCategoryAction: vi.fn(),
  refresh: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/src/app/(app)/categorias/actions", () => ({
  archiveCategoryAction: mocks.archiveCategoryAction,
  archiveSubcategoryAction: vi.fn(),
  createCategoryAction: vi.fn(),
  createSubcategoryAction: vi.fn(),
  moveCategoryAction: mocks.moveCategoryAction,
  restoreCategoryAction: mocks.restoreCategoryAction,
  restoreSubcategoryAction: vi.fn(),
  updateCategoryAction: vi.fn(),
  updateSubcategoryAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

const data: CategoryManagementPageData = {
  householdName: "Nosso lar",
  areaCategories: [
    {
      id: "area-home",
      name: "Moradia",
      color: "#2f855a",
      icon: "home",
      sortOrder: 0,
      archivedAt: null,
      subcategories: [
        { id: "subcategory-bills", name: "Contas", archivedAt: null },
      ],
    },
    {
      id: "area-food",
      name: "Alimentação",
      color: "#d97706",
      icon: "utensils",
      sortOrder: 1,
      archivedAt: null,
      subcategories: [
        { id: "subcategory-market", name: "Feira", archivedAt: null },
      ],
    },
    {
      id: "area-archived",
      name: "Antiga",
      color: "#64748b",
      icon: null,
      sortOrder: 2,
      archivedAt: "2026-10-01T00:00:00.000Z",
      subcategories: [],
    },
  ],
  profileCategories: [
    {
      id: "profile-fixed",
      name: "Fixo",
      color: "#0000ff",
      icon: "wallet",
      sortOrder: 0,
      archivedAt: null,
      subcategories: [],
    },
  ],
};

const success = { ok: true as const, message: "Alteração salva." };

afterEach(() => cleanup());

beforeEach(() => {
  vi.clearAllMocks();
  mocks.archiveCategoryAction.mockResolvedValue(success);
  mocks.moveCategoryAction.mockResolvedValue(success);
  mocks.restoreCategoryAction.mockResolvedValue(success);
});

describe("CategoryManagement", () => {
  it("offers category ordering and archival controls for the couple's catalog", () => {
    render(<CategoryManagement data={data} />);

    expect(screen.getByText("Categorias de área")).toBeInTheDocument();
    expect(screen.getByText("Categorias de perfil")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mover categoria Moradia para cima" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Mover categoria Alimentação para cima" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Arquivar categoria Alimentação" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Restaurar categoria Antiga" }),
    ).toBeInTheDocument();
  });

  it("persists category moves and restores archived categories", async () => {
    render(<CategoryManagement data={data} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Mover categoria Alimentação para cima" }),
    );
    await waitFor(() =>
      expect(mocks.moveCategoryAction).toHaveBeenCalledWith({
        categoryId: "area-food",
        direction: "up",
      }),
    );
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());

    const restoreButton = screen.getByRole("button", {
      name: "Restaurar categoria Antiga",
    });
    await waitFor(() => expect(restoreButton).toBeEnabled());
    fireEvent.click(restoreButton);
    await waitFor(() =>
      expect(mocks.restoreCategoryAction).toHaveBeenCalledWith({
        categoryId: "area-archived",
      }),
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("archives a category without removing its subcategory history", async () => {
    render(<CategoryManagement data={data} />);

    expect(screen.getByText("Feira")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Arquivar categoria Alimentação" }),
    );

    await waitFor(() =>
      expect(mocks.archiveCategoryAction).toHaveBeenCalledWith({
        categoryId: "area-food",
      }),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Alteração salva.");
  });
});

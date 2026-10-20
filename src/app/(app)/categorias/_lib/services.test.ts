import { CategoryKind } from "@/prisma/generated/enums";
import { describe, expect, it, vi } from "vitest";

import {
  createCategory,
  getCategoriesForManagement,
  moveCategory,
  restoreSubcategory,
  CategoryNotFoundError,
} from "@/src/app/(app)/categorias/_lib/services";
import type { CategoryRepository } from "@/src/app/(app)/categorias/_lib/services";
import type { AuthContext } from "@/src/lib/auth/context";
import type { CategoryManagementRecord } from "@/src/app/(app)/categorias/_lib/repository";
import type { MoveCategoryResult } from "@/src/app/(app)/categorias/_lib/repository";

const context: AuthContext = {
  userId: "user-1",
  householdId: "household-1",
  householdName: "Nosso lar",
  members: [],
};

const categories = [
  {
    id: "area-home",
    name: "Moradia",
    kind: CategoryKind.AREA,
    color: "#2f855a",
    icon: "home",
    sortOrder: 0,
    archivedAt: null,
    areaSubcategories: [
      { id: "subcategory-bills", name: "Contas", archivedAt: null },
    ],
  },
  {
    id: "profile-fixed",
    name: "Fixo",
    kind: CategoryKind.PROFILE,
    color: "#0000ff",
    icon: null,
    sortOrder: 0,
    archivedAt: new Date("2026-10-01T00:00:00.000Z"),
    areaSubcategories: [],
  },
] satisfies CategoryManagementRecord[];

function createRepository(
  managementCategories: CategoryManagementRecord[] = [],
): CategoryRepository {
  return {
    findCategoriesForManagement: vi.fn(async () => managementCategories),
    createCategory: vi.fn(async () => ({ id: "new-category" })),
    updateCategory: vi.fn(async () => true),
    moveCategory: vi.fn(
      async (): Promise<MoveCategoryResult> => "moved",
    ),
    archiveCategory: vi.fn(async () => true),
    restoreCategory: vi.fn(async () => true),
    createSubcategory: vi.fn(async () => ({ id: "new-subcategory" })),
    updateSubcategory: vi.fn(async () => true),
    archiveSubcategory: vi.fn(async () => true),
    restoreSubcategory: vi.fn(async () => true),
  };
}

describe("category services", () => {
  it("loads and maps categories scoped to the authenticated household", async () => {
    const repository = createRepository(categories);

    await expect(getCategoriesForManagement(context, repository)).resolves.toEqual({
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
      ],
      profileCategories: [
        {
          id: "profile-fixed",
          name: "Fixo",
          color: "#0000ff",
          icon: null,
          sortOrder: 0,
          archivedAt: "2026-10-01T00:00:00.000Z",
          subcategories: [],
        },
      ],
    });
    expect(repository.findCategoriesForManagement).toHaveBeenCalledWith(
      "household-1",
    );
  });

  it("creates a category using the household from auth context", async () => {
    const repository = createRepository();

    await createCategory(
      context,
      {
        kind: "AREA",
        name: "  Alimentação  ",
        color: "#d97706",
        icon: "utensils",
      },
      repository,
    );

    expect(repository.createCategory).toHaveBeenCalledWith("household-1", {
      kind: CategoryKind.AREA,
      name: "Alimentação",
      color: "#d97706",
      icon: "utensils",
    });
  });

  it("returns false when a category is already at the requested boundary", async () => {
    const repository = createRepository();
    vi.mocked(repository.moveCategory).mockResolvedValue("at-boundary");

    await expect(
      moveCategory(context, "area-home", "up", repository),
    ).resolves.toBe(false);
    expect(repository.moveCategory).toHaveBeenCalledWith(
      "household-1",
      "area-home",
      "up",
    );
  });

  it("rejects restoration when a subcategory does not belong to the household", async () => {
    const repository = createRepository();
    vi.mocked(repository.restoreSubcategory).mockResolvedValue(false);

    await expect(
      restoreSubcategory(context, "area-home", "foreign-subcategory", repository),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
    expect(repository.restoreSubcategory).toHaveBeenCalledWith(
      "household-1",
      "area-home",
      "foreign-subcategory",
    );
  });
});

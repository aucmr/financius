import { describe, expect, it } from "vitest";

import {
  categoryFormSchema,
  createCategorySchema,
  getCategoryFieldErrors,
  moveCategorySchema,
} from "@/src/app/(app)/categorias/_lib/schemas";

describe("category schemas", () => {
  it("trims valid category names and accepts the supported appearance", () => {
    expect(
      categoryFormSchema.parse({
        name: "  Moradia  ",
        color: "#2f855a",
        icon: "home",
      }),
    ).toEqual({
      name: "Moradia",
      color: "#2f855a",
      icon: "home",
    });
  });

  it("rejects fields that must be derived by the server", () => {
    expect(
      createCategorySchema.safeParse({
        name: "Moradia",
        color: "#2f855a",
        icon: "home",
        kind: "AREA",
        householdId: "another-household",
      }).success,
    ).toBe(false);
  });

  it("returns field errors for an invalid color and icon", () => {
    const result = categoryFormSchema.safeParse({
      name: "Moradia",
      color: "green",
      icon: "unknown",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(getCategoryFieldErrors(result.error)).toEqual({
        color: "Selecione uma cor válida.",
        icon: expect.any(String),
      });
    }
  });

  it("accepts only a known category move direction", () => {
    expect(
      moveCategorySchema.safeParse({
        categoryId: "category-id",
        direction: "up",
      }).success,
    ).toBe(true);
    expect(
      moveCategorySchema.safeParse({
        categoryId: "category-id",
        direction: "left",
      }).success,
    ).toBe(false);
  });
});

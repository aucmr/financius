"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type CategoryKind = "AREA" | "PROFILE";

type CreateCategoryInput = {
  name: string;
  kind: CategoryKind;
  color: string;
  icon?: string;
};

async function requireAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthenticated");
  }
}

export async function getCategories(kind: CategoryKind) {
  await requireAuthenticatedUser();

  return prisma.category.findMany({
    where: { kind, type: "EXPENSE" },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(input: CreateCategoryInput) {
  await requireAuthenticatedUser();

  const name = input.name.trim();
  if (!name) {
    throw new Error("Category name is required");
  }

  const color = input.color.trim();
  if (!color) {
    throw new Error("Category color is required");
  }

  return prisma.category.create({
    data: {
      name,
      kind: input.kind,
      type: "EXPENSE",
      color,
      icon: input.icon?.trim() || null,
    },
  });
}

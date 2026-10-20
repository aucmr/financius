import { describe, expect, it, vi } from "vitest";

import type { AuthContext } from "@/src/lib/auth/context";
import type { PayablesRepository } from "@/src/app/(app)/contas-a-pagar/_lib/services";
import {
  createPayableItem,
  getPayablesForMonth,
  movePayableItem,
  renamePayableItem,
  updateMonthlyPayableStatus,
} from "@/src/app/(app)/contas-a-pagar/_lib/services";

const context: AuthContext = {
  userId: "member-id",
  householdId: "household-id",
  householdName: "Casa",
  members: [
    { id: "member-id", name: "Pessoa 1", email: "one@example.com" },
    { id: "other-member-id", name: "Pessoa 2", email: "two@example.com" },
  ],
};

function createRepository(): PayablesRepository {
  return {
    ensureDefaultPayableItems: vi.fn().mockResolvedValue(undefined),
    findPayableItemsForMonth: vi.fn().mockResolvedValue([
      {
        id: "paid-item",
        name: "condominio",
        sortOrder: 0,
        monthlyStatuses: [{ isPaid: true }],
      },
      {
        id: "pending-item",
        name: "cartão XP",
        sortOrder: 1,
        monthlyStatuses: [],
      },
    ]),
    findPayableItemsForManagement: vi.fn().mockResolvedValue([]),
    createPayableItem: vi.fn().mockResolvedValue({ id: "new-item" }),
    renamePayableItem: vi.fn().mockResolvedValue(true),
    movePayableItem: vi.fn().mockResolvedValue("moved"),
    archivePayableItem: vi.fn().mockResolvedValue(true),
    setMonthlyPayableStatus: vi.fn().mockResolvedValue(true),
  };
}

describe("payable checklist service", () => {
  it("loads a month for the authenticated household and defaults missing statuses to pending", async () => {
    const repository = createRepository();

    const result = await getPayablesForMonth(context, "2026-10", repository);

    expect(repository.ensureDefaultPayableItems).toHaveBeenCalledWith(
      "household-id",
    );
    expect(repository.findPayableItemsForMonth).toHaveBeenCalledWith({
      householdId: "household-id",
      year: 2026,
      month: 10,
      periodStart: new Date("2026-10-01T00:00:00.000Z"),
      periodEnd: new Date("2026-11-01T00:00:00.000Z"),
    });
    expect(result).toEqual({
      month: "2026-10",
      items: [
        { id: "paid-item", name: "condominio", isPaid: true },
        { id: "pending-item", name: "cartão XP", isPaid: false },
      ],
      paidCount: 1,
      pendingCount: 1,
    });
  });

  it("rejects an invalid month before querying the repository", async () => {
    const repository = createRepository();

    await expect(
      getPayablesForMonth(context, "2026-13", repository),
    ).rejects.toThrow("Mês inválido.");
    expect(repository.findPayableItemsForMonth).not.toHaveBeenCalled();
  });

  it("creates and renames items using only the household from auth context", async () => {
    const repository = createRepository();

    await createPayableItem(context, { name: "Internet" }, repository);
    await renamePayableItem(
      context,
      "item-id",
      { name: "Internet residencial" },
      repository,
    );

    expect(repository.ensureDefaultPayableItems).toHaveBeenCalledWith(
      "household-id",
    );
    expect(repository.createPayableItem).toHaveBeenCalledWith(
      "household-id",
      "Internet",
    );
    expect(repository.renamePayableItem).toHaveBeenCalledWith(
      "household-id",
      "item-id",
      "Internet residencial",
    );
  });

  it("sets payment state for the selected month and household", async () => {
    const repository = createRepository();

    await updateMonthlyPayableStatus(
      context,
      "item-id",
      "2026-10",
      true,
      repository,
    );

    expect(repository.setMonthlyPayableStatus).toHaveBeenCalledWith({
      householdId: "household-id",
      itemId: "item-id",
      year: 2026,
      month: 10,
      periodStart: new Date("2026-10-01T00:00:00.000Z"),
      periodEnd: new Date("2026-11-01T00:00:00.000Z"),
      isPaid: true,
    });
  });

  it("returns whether an item could be moved and scopes the operation to the household", async () => {
    const repository = createRepository();

    await expect(
      movePayableItem(context, "item-id", "up", repository),
    ).resolves.toBe(true);
    expect(repository.movePayableItem).toHaveBeenCalledWith(
      "household-id",
      "item-id",
      "up",
    );

    vi.mocked(repository.movePayableItem).mockResolvedValue("at-boundary");
    await expect(
      movePayableItem(context, "item-id", "up", repository),
    ).resolves.toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import {
  archivePayableItemSchema,
  movePayableItemSchema,
  monthlyPayableStatusSchema,
  payableItemFormSchema,
  renamePayableItemSchema,
} from "@/src/app/(app)/contas-a-pagar/_lib/schemas";

describe("payable item schemas", () => {
  it("trims and validates an item name", () => {
    expect(payableItemFormSchema.parse({ name: "  Internet  " })).toEqual({
      name: "Internet",
    });
    expect(payableItemFormSchema.safeParse({ name: " " }).success).toBe(false);
    expect(
      payableItemFormSchema.safeParse({ name: "a".repeat(81) }).success,
    ).toBe(false);
  });

  it("rejects ownership fields supplied by the client", () => {
    expect(
      payableItemFormSchema.safeParse({
        name: "Internet",
        householdId: "forged-household",
      }).success,
    ).toBe(false);
    expect(
      renamePayableItemSchema.safeParse({
        itemId: "item-id",
        name: "Internet",
        householdId: "forged-household",
      }).success,
    ).toBe(false);
  });

  it.each(["2026-00", "2026-13", "2026-1", "invalid"])(
    "rejects invalid month %s",
    (month) => {
      expect(
        monthlyPayableStatusSchema.safeParse({
          itemId: "item-id",
          month,
          isPaid: true,
        }).success,
      ).toBe(false);
    },
  );

  it("accepts a valid monthly status and rejects invalid item operations", () => {
    expect(
      monthlyPayableStatusSchema.safeParse({
        itemId: "item-id",
        month: "2026-10",
        isPaid: true,
      }).success,
    ).toBe(true);
    expect(
      movePayableItemSchema.safeParse({
        itemId: "item-id",
        direction: "sideways",
      }).success,
    ).toBe(false);
    expect(
      archivePayableItemSchema.safeParse({
        itemId: "item-id",
        permanent: true,
      }).success,
    ).toBe(false);
  });
});

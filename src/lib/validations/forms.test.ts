import { describe, expect, it } from "vitest";
import { expenseFormSchema } from "./expense";
import { incomeFormSchema } from "./income";
import { loginFormSchema } from "./login";

describe("Form validation schemas", () => {
  it("rejects invalid login email", () => {
    const parsed = loginFormSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects negative expense amount", () => {
    const parsed = expenseFormSchema.safeParse({
      description: "Supermarket",
      amount: -10,
      date: "2026-06-29",
      areaCategoryId: "area-id",
      profileCategoryId: "profile-id",
      responsibleUserId: "user-id",
      notes: "",
      recurring: false,
      shared: false,
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts valid income payload", () => {
    const parsed = incomeFormSchema.safeParse({
      description: "Salary",
      amount: 3500,
      date: "2026-06-29",
      ownerUserId: "user-id",
      notes: "",
      recurring: true,
    });

    expect(parsed.success).toBe(true);
  });
});

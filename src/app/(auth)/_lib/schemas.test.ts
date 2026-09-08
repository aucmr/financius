import { describe, expect, it } from "vitest";

import {
  parseSignInInput,
  parseSignUpInput,
} from "@/src/app/(auth)/_lib/schemas";

describe("auth schemas", () => {
  it("accepts valid sign-in payload", () => {
    const result = parseSignInInput({
      email: "user@example.com",
      password: "password123",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects invalid sign-in email", () => {
    const result = parseSignInInput({
      email: "invalid",
      password: "password123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("Email is invalid.");
    }
  });

  it("rejects short sign-up name", () => {
    const result = parseSignUpInput({
      name: "A",
      email: "user@example.com",
      password: "password123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("Name must be at least 2 characters.");
    }
  });
});

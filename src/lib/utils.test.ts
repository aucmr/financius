import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, monthName } from "./utils";

describe("formatCurrency", () => {
  it("formats zero as R$ 0,00", () => {
    expect(formatCurrency(0)).toBe("R$\u00a00,00");
  });

  it("formats a positive value with decimal places", () => {
    expect(formatCurrency(1234.56)).toBe("R$\u00a01.234,56");
  });

  it("formats a negative value", () => {
    expect(formatCurrency(-99.9)).toBe("-R$\u00a099,90");
  });
});

describe("formatDate", () => {
  it("formats a date as dd/mm/yyyy", () => {
    expect(formatDate(new Date(2025, 0, 5))).toBe("05/01/2025");
  });
});

describe("monthName", () => {
  it("returns janeiro for month 1", () => {
    expect(monthName(1)).toBe("janeiro");
  });

  it("returns dezembro for month 12", () => {
    expect(monthName(12)).toBe("dezembro");
  });
});

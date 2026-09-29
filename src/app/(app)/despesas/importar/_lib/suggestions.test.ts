import { describe, expect, it } from "vitest";

import { rankExpenseSuggestions } from "@/src/app/(app)/despesas/importar/_lib/suggestions";

const candidate = {
  description: "Mercado da semana",
  notes: "Compra compartilhada",
  areaCategoryId: "alimentacao",
  areaCategoryName: "Alimentacao",
  areaSubcategoryId: "mercado",
  areaSubcategoryName: "Mercado",
  profileCategoryId: "fixo",
  profileCategoryName: "CustoFixo",
};

describe("expense import suggestions", () => {
  it("ranks exact historical descriptions first", () => {
    const result = rankExpenseSuggestions("Mercado da semana", [
      candidate,
      {
        ...candidate,
        description: "Mercado do mes",
        areaSubcategoryId: "outros",
        areaSubcategoryName: "Outros",
      },
    ]);

    expect(result[0]).toMatchObject({
      areaSubcategoryId: "mercado",
      source: "EXACT",
      confidence: 1,
    });
  });

  it("groups similar records by the complete category combination", () => {
    const result = rankExpenseSuggestions("Padaria e mercearia", [
      { ...candidate, description: "Padaria e mercearia pal" },
      { ...candidate, description: "Padaria mercearia centro" },
      {
        ...candidate,
        description: "Padaria e mercearia pal",
        profileCategoryId: "prazer",
        profileCategoryName: "Prazer",
      },
    ]);

    expect(result[0].matchCount).toBe(2);
    expect(result[0].profileCategoryId).toBe("fixo");
    expect(result).toHaveLength(2);
  });
});

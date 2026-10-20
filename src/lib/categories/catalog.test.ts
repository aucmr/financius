import { describe, expect, it } from "vitest";

import {
  CATEGORY_ICON_NAMES,
  DEFAULT_AREA_CATEGORY_CATALOG,
  DEFAULT_PROFILE_CATEGORY_CATALOG,
} from "./catalog";

describe("default category icon catalog", () => {
  it("assigns a meaningful supported icon to every area category", () => {
    expect(
      Object.fromEntries(
        DEFAULT_AREA_CATEGORY_CATALOG.map(({ name, icon }) => [name, icon]),
      ),
    ).toEqual({
      Alimentação: "utensils",
      Casa: "home",
      Educação: "book-open",
      Filhos: "baby",
      Lazer: "gamepad-2",
      Outros: "package",
      Pessoal: "user-round",
      Saúde: "heart-pulse",
      Transporte: "car-front",
      Viagens: "plane",
    });
  });

  it("assigns a meaningful supported icon to every profile category", () => {
    expect(
      Object.fromEntries(
        DEFAULT_PROFILE_CATEGORY_CATALOG.map(({ name, icon }) => [name, icon]),
      ),
    ).toEqual({
      Conhecimento: "brain",
      Conforto: "armchair",
      CustoFixo: "receipt-text",
      Liberdade: "bird",
      Prazer: "party-popper",
    });

    for (const category of [
      ...DEFAULT_AREA_CATEGORY_CATALOG,
      ...DEFAULT_PROFILE_CATEGORY_CATALOG,
    ]) {
      expect(CATEGORY_ICON_NAMES).toContain(category.icon);
    }
  });
});

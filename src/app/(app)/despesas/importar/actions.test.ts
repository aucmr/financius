import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/db/prisma", () => ({ prisma: {} }));
vi.mock("@/src/lib/auth/context", () => ({
  HouseholdAccessError: class HouseholdAccessError extends Error {},
  UnauthorizedError: class UnauthorizedError extends Error {},
  getAuthContext: vi.fn(),
}));

import { parseImportAction } from "@/src/app/(app)/despesas/importar/actions";

describe("import actions", () => {
  it("parses a supported file through the server action boundary", async () => {
    const content = readFileSync("docs/aux/XP - Fatura2026-06-10.csv", "utf-8");

    const result = await parseImportAction({
      source: "XP",
      fileName: "fatura.csv",
      content,
      statementDate: "2026-06-10",
    });

    expect(result).toMatchObject({
      ok: true,
      data: {
        source: "XP",
        fileName: "fatura.csv",
        fileFingerprint: expect.stringMatching(/^[a-f0-9]{16,64}$/),
      },
    });
  });

  it("rejects a card import without a statement date before parsing", async () => {
    const result = await parseImportAction({
      source: "XP",
      fileName: "fatura.csv",
      content:
        "Data,Estabelecimento,Portador,Valor,Parcela\n01/06/2026,Loja,Pessoa,10,00,1/1",
      statementDate: null,
    });

    expect(result).toMatchObject({
      ok: false,
      message: "Informe a competencia da fatura.",
    });
  });

  it("rejects a selected source that does not match the headers", async () => {
    const result = await parseImportAction({
      source: "BB",
      fileName: "fatura.csv",
      content:
        "Data,Estabelecimento,Portador,Valor,Parcela\n01/06/2026,Loja,Pessoa,10,00,1/1",
      statementDate: null,
    });

    expect(result).toMatchObject({
      ok: false,
      message: "O formato detectado nao corresponde a instituicao selecionada.",
    });
  });
});

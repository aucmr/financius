import { describe, expect, it, vi } from "vitest";

import type { AuthContext } from "@/src/lib/auth/context";
import type { ImportBatchInput } from "@/src/app/(app)/despesas/importar/_lib/schemas";
import {
  createImport,
  getImportSuggestions,
  type ImportRepository,
} from "@/src/app/(app)/despesas/importar/_lib/services";

const context: AuthContext = {
  userId: "creator-id",
  householdId: "household-id",
  householdName: "Casa",
  members: [
    { id: "creator-id", name: "Pessoa 1", email: "one@example.com" },
    { id: "member-id", name: "Pessoa 2", email: "two@example.com" },
  ],
};

function createRow(overrides: Partial<ImportBatchInput["rows"][number]> = {}) {
  return {
    rowNumber: 2,
    source: "XP" as const,
    description: "Estorno loja",
    amount: "-45.93",
    transactionDate: "2026-06-10",
    cardholder: "Pessoa 1",
    installment: { current: 2, total: 3 },
    authorizationCode: "ABC123",
    documentNumber: "5250",
    metadata: { originalAmount: "R$ -45,93" },
    areaCategoryId: "area-id",
    areaSubcategoryId: "subcategory-id",
    profileCategoryId: "profile-id",
    responsibleUserId: "member-id",
    notes: "Ajuste confirmado",
    shared: true,
    recurring: false,
    allowDuplicateImport: false,
    ...overrides,
  };
}

function createBatch(
  overrides: Partial<ImportBatchInput> = {},
): ImportBatchInput {
  return {
    source: "XP",
    fileName: "XP - Fatura.csv",
    fileFingerprint: "a".repeat(64),
    statementDate: "2026-06-15",
    totalRows: 1,
    ignoredRows: 0,
    skippedRows: 0,
    rows: [createRow()],
    ...overrides,
  };
}

function createRepository() {
  return {
    findExpenseReferences: vi.fn().mockResolvedValue({
      areaCategory: { id: "area-id" },
      areaSubcategory: { id: "subcategory-id" },
      profileCategory: { id: "profile-id" },
      responsibleMember: { userId: "member-id" },
    }),
    findImportSuggestionCandidates: vi.fn().mockResolvedValue([]),
    findImportDuplicateCandidates: vi.fn().mockResolvedValue([]),
    createImportBatch: vi.fn().mockResolvedValue({ id: "batch-id" }),
  } satisfies ImportRepository;
}

describe("import service", () => {
  it("imports reported XP amounts without floating-point cent errors", async () => {
    const repository = createRepository();
    const expectedRows = [
      { rowNumber: 3, amount: "298.21" },
      { rowNumber: 36, amount: "73.07" },
      { rowNumber: 38, amount: "137.17" },
      { rowNumber: 44, amount: "67.60" },
      { rowNumber: 46, amount: "143.55" },
      { rowNumber: 55, amount: "259.90" },
      { rowNumber: 56, amount: "154.48" },
    ];

    const result = await createImport(
      context,
      createBatch({
        totalRows: expectedRows.length,
        rows: expectedRows.map((row) => createRow(row)),
      }),
      repository,
    );
    const persistedRows = repository.createImportBatch.mock.calls[0][0]
      .expenses as Array<{
      importRowNumber: number;
      amount: string;
    }>;

    expect(result).toMatchObject({
      importedRows: expectedRows.length,
      failedRows: 0,
    });
    expect(
      persistedRows.map(({ importRowNumber, amount }) => ({
        rowNumber: importRowNumber,
        amount,
      })),
    ).toEqual(expectedRows);
  });

  it("still rejects an actual zero amount as zero", async () => {
    const repository = createRepository();

    const result = await createImport(
      context,
      createBatch({ rows: [createRow({ amount: "0.00" })] }),
      repository,
    );

    expect(result.failedRows).toBe(1);
    expect(result.errors).toContain(
      "Linha 2: O valor importado nao pode ser zero.",
    );
  });

  it("persists signed card amounts with separate statement and purchase dates", async () => {
    const repository = createRepository();

    const result = await createImport(context, createBatch(), repository);
    const persisted = repository.createImportBatch.mock.calls[0][0].expenses[0];

    expect(result).toMatchObject({
      batchId: "batch-id",
      importedRows: 1,
      failedRows: 0,
    });
    expect(persisted).toMatchObject({
      householdId: "household-id",
      userId: "creator-id",
      amount: "-45.93",
      date: new Date("2026-06-15T00:00:00.000Z"),
      creditCardTransactionDate: new Date("2026-06-10T00:00:00.000Z"),
      responsibleUserId: "member-id",
    });
    expect(persisted.notes).toBe("Ajuste confirmado");
    expect(persisted.importMetadata).toMatchObject({
      cardholder: "Pessoa 1",
      installment: "2/3",
      authorizationCode: "ABC123",
      documentNumber: "5250",
    });
  });

  it("does not create notes from CSV metadata when no freeform note was entered", async () => {
    const repository = createRepository();

    await createImport(
      context,
      createBatch({ rows: [createRow({ notes: "" })] }),
      repository,
    );
    const persisted = repository.createImportBatch.mock.calls[0][0].expenses[0];

    expect(persisted.notes).toBeNull();
    expect(persisted.importMetadata).toMatchObject({
      cardholder: "Pessoa 1",
      installment: "2/3",
    });
  });

  it("filters generated metadata from historical import suggestions only", async () => {
    const repository = createRepository();
    repository.findImportSuggestionCandidates.mockResolvedValue([
      {
        description: "Kicks",
        notes:
          "Kicks | Portador: Pessoa 1 | Parcela: 2/3 | Autorizacao: ABC123 | Documento/cartao: 5250",
        importBatchId: "batch-id",
        importMetadata: {
          cardholder: "Pessoa 1",
          installment: "2/3",
          authorizationCode: "ABC123",
          documentNumber: "5250",
        },
        areaCategory: { id: "area-id", name: "Casa" },
        areaSubcategory: { id: "subcategory-id", name: "Compras" },
        profileCategory: { id: "profile-id", name: "Pessoal" },
      },
      {
        description: "Kicks",
        notes: "Portador: observação livre",
        importBatchId: null,
        importMetadata: null,
        areaCategory: { id: "area-id", name: "Casa" },
        areaSubcategory: { id: "other-subcategory-id", name: "Outros" },
        profileCategory: { id: "profile-id", name: "Pessoal" },
      },
    ]);

    const suggestions = await getImportSuggestions(context, "Kicks", repository);

    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          areaSubcategoryId: "subcategory-id",
          notes: "Kicks",
        }),
        expect.objectContaining({
          areaSubcategoryId: "other-subcategory-id",
          notes: "Portador: observação livre",
        }),
      ]),
    );
  });

  it("keeps duplicate rows out unless the review explicitly allows them", async () => {
    const repository = createRepository();
    repository.findImportDuplicateCandidates.mockResolvedValue([
      {
        id: "existing-id",
        description: "Estorno loja",
        amount: { toString: () => "-45.93" },
        date: new Date("2026-06-15T00:00:00.000Z"),
        creditCardTransactionDate: new Date("2026-06-10T00:00:00.000Z"),
        importFingerprint: null,
        importBatch: { source: "XP", fileName: "old.csv" },
      },
    ]);

    const result = await createImport(context, createBatch(), repository);

    expect(result).toMatchObject({ importedRows: 0, failedRows: 1 });
    expect(repository.createImportBatch).toHaveBeenCalledWith(
      expect.objectContaining({ expenses: [] }),
    );
  });
});

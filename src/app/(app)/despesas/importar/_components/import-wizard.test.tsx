// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    createImportBatchAction,
    getImportDuplicateMatchesAction,
    getImportSuggestionsAction,
    parseImportAction,
} from "@/src/app/(app)/despesas/importar/actions";
import { ImportWizard } from "@/src/app/(app)/despesas/importar/_components/import-wizard";
import type { ExpenseOptions } from "@/src/app/(app)/despesas/_lib/types";

vi.mock("@/src/app/(app)/despesas/importar/actions", () => ({
    createImportBatchAction: vi.fn(),
    getImportDuplicateMatchesAction: vi.fn(),
    getImportSuggestionsAction: vi.fn(),
    parseImportAction: vi.fn(),
}));

const options: ExpenseOptions = {
    areaCategories: [
        {
            id: "area-food",
            name: "Alimentacao",
            color: "#008000",
            icon: null,
            subcategories: [{ id: "subcategory-market", name: "Mercado" }],
        },
    ],
    profileCategories: [{ id: "profile-fixed", name: "CustoFixo", color: "#0000ff", icon: null }],
    members: [{ id: "member-1", name: "Ana", email: "ana@example.com" }],
};

const csvContent = "Data;Estabelecimento;Portador;Valor;Parcela\n01/08/2026;LOJA;ANA;R$ 10,00;-";

function parsedRow(rowNumber: number, description: string) {
    return {
        rowNumber,
        source: "XP" as const,
        description,
        amount: "10.00",
        transactionDate: "2026-08-01",
        cardholder: "ANA",
        installment: null,
        authorizationCode: null,
        documentNumber: null,
        metadata: {},
    };
}

function setupParsedActions() {
    vi.mocked(parseImportAction).mockResolvedValue({
        ok: true,
        message: "Arquivo lido.",
        data: {
            source: "XP",
            fileName: "fatura.csv",
            fileFingerprint: "a".repeat(64),
            statementDate: "2026-08-10",
            ignoredRows: [],
            rows: [parsedRow(2, "Mercado original"), parsedRow(3, "Farmacia")],
        },
    });
    vi.mocked(getImportSuggestionsAction).mockResolvedValue({
        ok: true,
        message: "Sugestoes carregadas.",
        data: [],
    });
    vi.mocked(getImportDuplicateMatchesAction).mockResolvedValue({
        ok: true,
        message: "Duplicidades verificadas.",
        data: [],
    });
    vi.mocked(createImportBatchAction).mockResolvedValue({
        ok: true,
        message: "Importacao concluida.",
        data: {
            batchId: "batch-1",
            status: "COMPLETED",
            importedRows: 2,
            ignoredRows: 0,
            skippedRows: 0,
            failedRows: 0,
            errors: [],
        },
    });
}

async function startReview() {
    render(<ImportWizard householdName="Casa" options={options} />);
    fireEvent.click(screen.getByRole("button", { name: /XP/ }));
    fireEvent.change(screen.getByLabelText(/Competencia da fatura/), {
        target: { value: "2026-08-10" },
    });

    const file = new File([csvContent], "fatura.csv", { type: "text/csv" });
    Object.defineProperty(file, "arrayBuffer", {
        value: async () => new TextEncoder().encode(csvContent).buffer,
    });
    fireEvent.change(screen.getByLabelText("Arquivo CSV"), {
        target: { files: [file] },
    });
    await waitFor(() => expect(screen.getByText(/fatura.csv carregado/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Ler e revisar" }));
    await screen.findByText("Confirme cada lançamento");
    await waitFor(() => expect(screen.getByText("Nenhuma despesa semelhante encontrada.")).toBeInTheDocument());
}

function classifyCurrentRow() {
    fireEvent.change(screen.getByLabelText(/Categoria de area/), {
        target: { value: "area-food" },
    });
    fireEvent.change(screen.getByLabelText(/Categoria de perfil/), {
        target: { value: "profile-fixed" },
    });
}

afterEach(() => cleanup());

beforeEach(() => {
    vi.clearAllMocks();
    setupParsedActions();
});

describe("ImportWizard review navigation", () => {
    it("returns to the previous row, preserves edits, and submits each confirmed row once", async () => {
        await startReview();
        expect(screen.queryByRole("button", { name: "Despesa anterior" })).not.toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Descricao"), {
            target: { value: "Mercado revisado" },
        });
        classifyCurrentRow();
        fireEvent.click(screen.getByRole("button", { name: "Confirmar e proxima" }));

        expect(await screen.findByDisplayValue("Farmacia")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Despesa anterior" }));
        expect(await screen.findByDisplayValue("Mercado revisado")).toBeInTheDocument();
        expect(screen.getByLabelText(/Categoria de area/)).toHaveValue("area-food");

        fireEvent.click(screen.getByRole("button", { name: "Confirmar e proxima" }));
        expect(await screen.findByDisplayValue("Farmacia")).toBeInTheDocument();
        classifyCurrentRow();
        fireEvent.click(screen.getByRole("button", { name: "Confirmar e salvar" }));

        await waitFor(() => expect(createImportBatchAction).toHaveBeenCalledOnce());
        const submitted = vi.mocked(createImportBatchAction).mock.calls[0][0] as {
            rows: Array<{ description: string }>;
        };
        expect(submitted.rows.map((row) => row.description)).toEqual([
            "Mercado revisado",
            "Farmacia",
        ]);
    });

    it("replaces a confirmed decision with skipped when that row is revisited", async () => {
        await startReview();
        classifyCurrentRow();
        fireEvent.click(screen.getByRole("button", { name: "Confirmar e proxima" }));

        fireEvent.click(screen.getByRole("button", { name: "Despesa anterior" }));
        fireEvent.click(screen.getByRole("button", { name: "Pular linha" }));

        expect(await screen.findByDisplayValue("Farmacia")).toBeInTheDocument();
        classifyCurrentRow();
        fireEvent.click(screen.getByRole("button", { name: "Confirmar e salvar" }));

        await waitFor(() => expect(createImportBatchAction).toHaveBeenCalledOnce());
        const submitted = vi.mocked(createImportBatchAction).mock.calls[0][0] as {
            rows: Array<{ description: string }>;
            skippedRows: number;
        };
        expect(submitted.rows.map((row) => row.description)).toEqual(["Farmacia"]);
        expect(submitted.skippedRows).toBe(1);
    });

    it("replaces a skipped decision with confirmed when that row is revisited", async () => {
        await startReview();
        fireEvent.click(screen.getByRole("button", { name: "Pular linha" }));

        fireEvent.click(screen.getByRole("button", { name: "Despesa anterior" }));
        classifyCurrentRow();
        fireEvent.click(screen.getByRole("button", { name: "Confirmar e proxima" }));

        expect(await screen.findByDisplayValue("Farmacia")).toBeInTheDocument();
        classifyCurrentRow();
        fireEvent.click(screen.getByRole("button", { name: "Confirmar e salvar" }));

        await waitFor(() => expect(createImportBatchAction).toHaveBeenCalledOnce());
        const submitted = vi.mocked(createImportBatchAction).mock.calls[0][0] as {
            rows: Array<{ description: string }>;
            skippedRows: number;
        };
        expect(submitted.rows.map((row) => row.description)).toEqual([
            "Mercado original",
            "Farmacia",
        ]);
        expect(submitted.skippedRows).toBe(0);
    });
});

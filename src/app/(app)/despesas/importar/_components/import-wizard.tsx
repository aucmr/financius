"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createImportBatchAction,
  getImportDuplicateMatchesAction,
  getImportSuggestionsAction,
  parseImportAction,
  type ImportCreationResult,
  type ParseImportData,
} from "@/src/app/(app)/despesas/importar/actions";
import type { ImportExpenseRowInput } from "@/src/app/(app)/despesas/importar/_lib/schemas";
import type { ImportDuplicateMatch } from "@/src/app/(app)/despesas/importar/_lib/services";
import type { ExpenseImportSuggestion } from "@/src/app/(app)/despesas/importar/_lib/suggestions";
import type { ExpenseOptions } from "@/src/app/(app)/despesas/_lib/types";
import {
  decodeCsvBytes,
  detectCsvSource,
  type IgnoredImportRow,
  type ImportSource,
  type ParsedImportRow,
} from "@/src/lib/imports";

const sourceLabels: Record<ImportSource, string> = {
  XP: "XP",
  BTG: "BTG",
  BB: "Banco do Brasil",
};

type ReviewRow = ParsedImportRow & {
  areaCategoryId: string;
  areaSubcategoryId: string;
  profileCategoryId: string;
  responsibleUserId: string;
  notes: string;
  shared: boolean;
  recurring: boolean;
  allowDuplicateImport: boolean;
};

type RowReviewDecision = "pending" | "confirmed" | "skipped";

type ImportWizardProps = {
  householdName: string;
  options: ExpenseOptions;
};

function createReviewRow(
  row: ParsedImportRow,
  responsibleUserId: string,
): ReviewRow {
  return {
    ...row,
    areaCategoryId: "",
    areaSubcategoryId: "",
    profileCategoryId: "",
    responsibleUserId,
    notes: "",
    shared: true,
    recurring: false,
    allowDuplicateImport: false,
  };
}

function toIdentity(row: Pick<ReviewRow, "rowNumber" | "source" | "description" | "amount" | "transactionDate" | "cardholder" | "installment" | "authorizationCode" | "documentNumber" | "metadata">) {
  return {
    rowNumber: row.rowNumber,
    source: row.source,
    description: row.description,
    amount: row.amount,
    transactionDate: row.transactionDate,
    cardholder: row.cardholder,
    installment: row.installment,
    authorizationCode: row.authorizationCode,
    documentNumber: row.documentNumber,
    metadata: row.metadata,
  };
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function ImportWizard({ householdName, options }: ImportWizardProps) {
  const [step, setStep] = useState<"setup" | "review" | "result">("setup");
  const [source, setSource] = useState<ImportSource | "">("");
  const [statementDate, setStatementDate] = useState("");
  const [responsibleUserId, setResponsibleUserId] = useState(options.members[0]?.id ?? "");
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [detectedSource, setDetectedSource] = useState<ImportSource | null>(null);
  const [parseData, setParseData] = useState<ParseImportData | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [rowDecisions, setRowDecisions] = useState<RowReviewDecision[]>([]);
  const [ignoredRows, setIgnoredRows] = useState<IgnoredImportRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<ExpenseImportSuggestion[]>([]);
  const [duplicates, setDuplicates] = useState<ImportDuplicateMatch[]>([]);
  const [loadedHelperKey, setLoadedHelperKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestionError, setSuggestionError] = useState("");
  const [duplicateError, setDuplicateError] = useState("");
  const [result, setResult] = useState<ImportCreationResult | null>(null);

  const currentRow = rows[currentIndex];
  const currentAreaCategoryId = currentRow?.areaCategoryId;
  const currentRowNumber = currentRow?.rowNumber;
  const currentRowSource = currentRow?.source;
  const currentRowDescription = currentRow?.description;
  const currentRowAmount = currentRow?.amount;
  const currentRowTransactionDate = currentRow?.transactionDate;
  const currentRowCardholder = currentRow?.cardholder;
  const currentRowInstallment = currentRow?.installment;
  const currentRowAuthorizationCode = currentRow?.authorizationCode;
  const currentRowDocumentNumber = currentRow?.documentNumber;
  const currentRowMetadata = currentRow?.metadata;
  const selectedAreaCategory = useMemo(
    () => options.areaCategories.find((category) => category.id === currentAreaCategoryId),
    [currentAreaCategoryId, options.areaCategories],
  );
  const selectedSubcategories = selectedAreaCategory?.subcategories ?? [];
  const currentRowIdentity = useMemo(
    () => {
      if (currentRowNumber === undefined) {
        return null;
      }

      return toIdentity({
        rowNumber: currentRowNumber,
        source: currentRowSource!,
        description: currentRowDescription!,
        amount: currentRowAmount!,
        transactionDate: currentRowTransactionDate!,
        cardholder: currentRowCardholder!,
        installment: currentRowInstallment!,
        authorizationCode: currentRowAuthorizationCode!,
        documentNumber: currentRowDocumentNumber!,
        metadata: currentRowMetadata!,
      });
    },
    [
      currentRowAmount,
      currentRowAuthorizationCode,
      currentRowCardholder,
      currentRowDescription,
      currentRowDocumentNumber,
      currentRowInstallment,
      currentRowMetadata,
      currentRowNumber,
      currentRowSource,
      currentRowTransactionDate,
    ],
  );
  const currentHelperKey = currentRowIdentity
    ? JSON.stringify([currentRowIdentity, parseData?.statementDate ?? null])
    : "";
  const isLoadingHelpers = step === "review" && Boolean(currentHelperKey) && loadedHelperKey !== currentHelperKey;
  const visibleSuggestions = loadedHelperKey === currentHelperKey ? suggestions : [];
  const visibleDuplicates = loadedHelperKey === currentHelperKey ? duplicates : [];
  const visibleSuggestionError = loadedHelperKey === currentHelperKey ? suggestionError : "";
  const visibleDuplicateError = loadedHelperKey === currentHelperKey ? duplicateError : "";

  useEffect(() => {
    if (step !== "review" || !currentRowIdentity) {
      return;
    }

    let cancelled = false;
    const helperKey = currentHelperKey;

    void (async () => {
      const suggestionResult = await getImportSuggestionsAction({
        description: currentRowIdentity.description,
      });
      if (cancelled) {
        return;
      }
      if (suggestionResult.ok) {
        const nextSuggestions = suggestionResult.data ?? [];
        setSuggestions(nextSuggestions);
        setSuggestionError("");

        const suggestion = nextSuggestions[0];
        if (suggestion) {
          setRows((previousRows) => {
            const row = previousRows[currentIndex];
            if (!row) {
              return previousRows;
            }

            const nextRow = {
              ...row,
              areaCategoryId: row.areaCategoryId || suggestion.areaCategoryId,
              areaSubcategoryId: row.areaSubcategoryId || suggestion.areaSubcategoryId,
              profileCategoryId: row.profileCategoryId || suggestion.profileCategoryId,
              notes: row.notes || suggestion.notes,
            };

            if (
              nextRow.areaCategoryId === row.areaCategoryId
              && nextRow.areaSubcategoryId === row.areaSubcategoryId
              && nextRow.profileCategoryId === row.profileCategoryId
              && nextRow.notes === row.notes
            ) {
              return previousRows;
            }

            return previousRows.map((item, index) => (index === currentIndex ? nextRow : item));
          });
        }
      } else {
        setSuggestions([]);
        setSuggestionError(suggestionResult.message);
      }

      const duplicateResult = await getImportDuplicateMatchesAction({
        row: currentRowIdentity,
        statementDate: parseData?.statementDate ?? null,
      });
      if (cancelled) {
        return;
      }
      if (duplicateResult.ok) {
        setDuplicates(duplicateResult.data ?? []);
        setDuplicateError("");
      } else {
        setDuplicates([]);
        setDuplicateError(duplicateResult.message);
      }
      setLoadedHelperKey(helperKey);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentHelperKey, currentIndex, currentRowIdentity, parseData?.statementDate, step]);

  function updateCurrentRow(patch: Partial<ReviewRow>) {
    setRows((previousRows) =>
      previousRows.map((row, index) => (index === currentIndex ? { ...row, ...patch } : row)),
    );
  }

  function updateCurrentAreaCategory(areaCategoryId: string) {
    const category = options.areaCategories.find((item) => item.id === areaCategoryId);
    const fallback = category?.subcategories.find((subcategory) => subcategory.name === "Outros")
      ?? category?.subcategories[0];

    updateCurrentRow({
      areaCategoryId,
      areaSubcategoryId: fallback?.id ?? "",
    });
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const decoded = decodeCsvBytes(await file.arrayBuffer());
      setFileName(file.name);
      setFileContent(decoded.text);
      setDetectedSource(detectCsvSource(decoded.text));
      setError("");
    } catch {
      setFileName("");
      setFileContent("");
      setDetectedSource(null);
      setError("Nao foi possivel ler o arquivo CSV.");
    }
  }

  async function handleStartReview() {
    if (!source || !fileName || !fileContent || !responsibleUserId) {
      setError("Selecione a instituicao, o responsavel e um arquivo CSV.");
      return;
    }
    if ((source === "XP" || source === "BTG") && !statementDate) {
      setError("Informe a competencia da fatura.");
      return;
    }
    if (detectedSource && detectedSource !== source) {
      setError(`O arquivo parece ser da ${sourceLabels[detectedSource]}.`);
      return;
    }

    setIsLoading(true);
    setError("");
    const response = await parseImportAction({
      source,
      fileName,
      content: fileContent,
      statementDate: statementDate || null,
    });
    setIsLoading(false);

    if (!response.ok || !response.data) {
      setError(response.message);
      return;
    }
    if (response.data.rows.length === 0) {
      setError("Nenhuma linha de despesa valida foi encontrada.");
      return;
    }

    setParseData(response.data);
    setIgnoredRows(response.data.ignoredRows);
    setRows(response.data.rows.map((row) => createReviewRow(row, responsibleUserId)));
    setRowDecisions(response.data.rows.map(() => "pending"));
    setCurrentIndex(0);
    setStep("review");
    setLoadedHelperKey("");
  }

  function validateCurrentRow() {
    if (!currentRow) {
      return "Linha nao encontrada.";
    }
    if (!currentRow.areaCategoryId || !currentRow.areaSubcategoryId || !currentRow.profileCategoryId) {
      return "Selecione as categorias de area, subcategoria e perfil.";
    }
    if (!currentRow.responsibleUserId) {
      return "Selecione o responsavel.";
    }
    if (duplicates.length > 0 && !currentRow.allowDuplicateImport) {
      return "Confirme a importacao da linha duplicada ou pule esta linha.";
    }
    return "";
  }

  function moveAfterReview(decision: Exclude<RowReviewDecision, "pending">) {
    const nextDecisions = rows.map((_, index) => rowDecisions[index] ?? "pending");
    nextDecisions[currentIndex] = decision;
    setRowDecisions(nextDecisions);

    if (currentIndex < rows.length - 1) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    const nextConfirmedRows = rows.filter((_, index) => nextDecisions[index] === "confirmed");
    const nextSkippedRows = nextDecisions.filter((item) => item === "skipped").length;
    void finishImport(nextConfirmedRows, nextSkippedRows);
  }

  function handleConfirmRow() {
    const validationError = validateCurrentRow();
    if (validationError || !currentRow) {
      setError(validationError);
      return;
    }

    setError("");
    moveAfterReview("confirmed");
  }

  function handleSkipRow() {
    setError("");
    moveAfterReview("skipped");
  }

  function handlePreviousRow() {
    if (currentIndex === 0 || isLoading) {
      return;
    }

    setError("");
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  async function finishImport(
    rowsToSave: ImportExpenseRowInput[],
    skippedCount: number,
  ) {
    if (!parseData) {
      return;
    }

    setIsLoading(true);
    setError("");
    const response = await createImportBatchAction({
      source: parseData.source,
      fileName: parseData.fileName,
      fileFingerprint: parseData.fileFingerprint,
      statementDate: parseData.statementDate,
      totalRows: rows.length + ignoredRows.length,
      ignoredRows: ignoredRows.length,
      skippedRows: skippedCount,
      rows: rowsToSave,
    });
    setIsLoading(false);

    if (!response.ok || !response.data) {
      setError(response.message);
      return;
    }

    setResult(response.data);
    setStep("result");
  }

  function reset() {
    setStep("setup");
    setSource("");
    setStatementDate("");
    setFileName("");
    setFileContent("");
    setDetectedSource(null);
    setParseData(null);
    setRows([]);
    setRowDecisions([]);
    setIgnoredRows([]);
    setCurrentIndex(0);
    setSuggestions([]);
    setDuplicates([]);
    setLoadedHelperKey("");
    setResult(null);
    setError("");
  }

  if (step === "result" && result) {
    return (
      <section className="mx-auto w-full max-w-5xl space-y-8">
        <header className="space-y-2">
          <span className="badge badge-soft badge-primary">Importacao</span>
          <h1 className="text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">Importacao concluida</h1>
          <p className="text-base text-base-content/60">O lote foi registrado no household {householdName}.</p>
        </header>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body gap-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="stat rounded-box bg-success/10 px-4 py-3">
                <div className="stat-title">Importadas</div>
                <div className="stat-value text-2xl text-success">{result.importedRows}</div>
              </div>
              <div className="stat rounded-box bg-base-200 px-4 py-3">
                <div className="stat-title">Ignoradas</div>
                <div className="stat-value text-2xl">{result.ignoredRows}</div>
              </div>
              <div className="stat rounded-box bg-base-200 px-4 py-3">
                <div className="stat-title">Puladas</div>
                <div className="stat-value text-2xl">{result.skippedRows}</div>
              </div>
              <div className="stat rounded-box bg-warning/10 px-4 py-3">
                <div className="stat-title">Falhas</div>
                <div className="stat-value text-2xl text-warning">{result.failedRows}</div>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="alert alert-warning items-start">
                <span className="icon-[tabler--alert-triangle] mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">Algumas linhas nao foram gravadas.</p>
                  <ul className="mt-1 list-disc space-y-1 ps-5 text-sm">
                    {result.errors.slice(0, 8).map((message) => <li key={message}>{message}</li>)}
                  </ul>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <a href="/despesas" className="btn btn-primary gap-2">
                <span className="icon-[tabler--receipt] size-4" aria-hidden="true" />
                Ver despesas
              </a>
              <button type="button" className="btn btn-soft btn-secondary" onClick={reset}>
                Importar outro arquivo
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (step === "review" && currentRow) {
    return (
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <span className="badge badge-soft badge-primary">Revisao de importacao</span>
            <h1 className="text-3xl font-semibold tracking-tight text-base-content">Confirme cada lançamento</h1>
            <p className="text-base text-base-content/60">As sugestoes preenchem a linha, mas nada sera salvo sem sua confirmacao.</p>
          </div>
          <div className="text-sm text-base-content/60">{currentIndex + 1} de {rows.length}</div>
        </header>
        <div className="h-2 overflow-hidden rounded-full bg-base-200">
          <div className="h-full bg-primary transition-all" style={{ width: `${((currentIndex + 1) / rows.length) * 100}%` }} />
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body gap-6">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]">
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Descricao</span>
                <input className="input input-bordered w-full" value={currentRow.description} onChange={(event) => updateCurrentRow({ description: event.target.value })} />
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Valor</span>
                <input className="input input-bordered w-full" inputMode="decimal" value={currentRow.amount} onChange={(event) => updateCurrentRow({ amount: event.target.value })} />
              </label>
              <div className="form-control w-full">
                <span className="label-text mb-1 font-medium">Origem</span>
                <div className="input input-bordered flex items-center gap-2 text-sm text-base-content/70">{sourceLabels[currentRow.source]}</div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-box border border-base-300 bg-base-200/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-base-content/50">Data da compra</p>
                <p className="mt-1 font-medium">{formatDate(currentRow.transactionDate)}</p>
                {currentRow.installment && <p className="mt-1 text-sm text-base-content/60">Parcela {currentRow.installment.current}/{currentRow.installment.total}</p>}
              </div>
              <div className="rounded-box border border-base-300 bg-base-200/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-base-content/50">Competencia</p>
                <p className="mt-1 font-medium">{parseData?.statementDate ? formatDate(parseData.statementDate) : "Data do extrato"}</p>
                {currentRow.cardholder && <p className="mt-1 text-sm text-base-content/60">Portador: {currentRow.cardholder}</p>}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Sugestao do historico</h2>
                  <p className="text-sm text-base-content/60">Escolha uma sugestao ou classifique manualmente.</p>
                </div>
                {isLoadingHelpers && <span className="loading loading-spinner loading-sm text-primary" aria-label="Carregando" />}
              </div>
              {suggestionError && <p className="text-sm text-warning">{suggestionError}</p>}
              {!isLoadingHelpers && !visibleSuggestionError && visibleSuggestions.length === 0 && <p className="text-sm text-base-content/50">Nenhuma despesa semelhante encontrada.</p>}
              <div className="grid gap-2">
                {visibleSuggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={`${suggestion.areaCategoryId}-${suggestion.areaSubcategoryId}-${suggestion.profileCategoryId}`}
                    className="rounded-box border border-base-300 bg-base-200/40 px-3 py-2 text-left transition-colors hover:border-primary hover:bg-primary/5"
                    onClick={() => updateCurrentRow({
                      areaCategoryId: suggestion.areaCategoryId,
                      areaSubcategoryId: suggestion.areaSubcategoryId,
                      profileCategoryId: suggestion.profileCategoryId,
                      notes: currentRow.notes || suggestion.notes,
                    })}
                  >
                    <span className="block text-sm font-medium">{suggestion.areaCategoryName} / {suggestion.areaSubcategoryName} / {suggestion.profileCategoryName}</span>
                    <span className="text-xs text-base-content/60">{suggestion.source} · {Math.round(suggestion.confidence * 100)}% de confianca · {suggestion.matchCount} ocorrencia(s) · {suggestion.matchedDescription}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Categoria de area</span>
                <select className="select select-bordered w-full" value={currentRow.areaCategoryId} onChange={(event) => updateCurrentAreaCategory(event.target.value)}>
                  <option value="">Selecione</option>
                  {options.areaCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Subcategoria</span>
                <select className="select select-bordered w-full" value={currentRow.areaSubcategoryId} disabled={!currentRow.areaCategoryId} onChange={(event) => updateCurrentRow({ areaSubcategoryId: event.target.value })}>
                  <option value="">Selecione</option>
                  {selectedSubcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
                </select>
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Categoria de perfil</span>
                <select className="select select-bordered w-full" value={currentRow.profileCategoryId} onChange={(event) => updateCurrentRow({ profileCategoryId: event.target.value })}>
                  <option value="">Selecione</option>
                  {options.profileCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="form-control w-full">
                <span className="label-text mb-1 font-medium">Responsavel</span>
                <div className="input input-bordered flex items-center text-sm text-base-content/70">
                  {options.members.find((member) => member.id === responsibleUserId)?.name ?? "Responsavel selecionado"}
                </div>
                <span className="label-text-alt mt-1 text-base-content/50">Definido para todo o arquivo.</span>
              </div>
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Observacoes</span>
                <input className="input input-bordered w-full" value={currentRow.notes} onChange={(event) => updateCurrentRow({ notes: event.target.value })} placeholder="Opcional" />
              </label>
            </div>
            {visibleDuplicates.length > 0 && (
              <div className="rounded-box border border-warning/40 bg-warning/10 p-4">
                <div className="flex items-start gap-3">
                  <span className="icon-[tabler--copy] mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Possivel duplicidade</p>
                    <p className="mt-1 text-sm text-base-content/70">Ja existe um lancamento com a mesma descricao, valor e data ou fingerprint.</p>
                    {visibleDuplicates.map((duplicate) => (
                      <p key={duplicate.id} className="mt-2 text-xs text-base-content/60">{duplicate.description} · {formatCurrency(duplicate.amount)} · {formatDate(duplicate.statementDate)}{duplicate.fileName ? ` · ${duplicate.fileName}` : ""}</p>
                    ))}
                    <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" className="checkbox checkbox-warning" checked={currentRow.allowDuplicateImport} onChange={(event) => updateCurrentRow({ allowDuplicateImport: event.target.checked })} />
                      Importar mesmo assim
                    </label>
                  </div>
                </div>
              </div>
            )}
            {visibleDuplicateError && <p className="text-sm text-warning">{visibleDuplicateError}</p>}
            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="checkbox checkbox-primary" checked={currentRow.shared} onChange={(event) => updateCurrentRow({ shared: event.target.checked })} /> Compartilhada</label>
              <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="checkbox checkbox-secondary" checked={currentRow.recurring} onChange={(event) => updateCurrentRow({ recurring: event.target.checked })} /> Recorrente</label>
            </div>
            {error && <div className="alert alert-error"><span>{error}</span></div>}
            <div className="flex flex-col-reverse gap-3 border-t border-base-200 pt-4 sm:flex-row sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" className="btn btn-soft btn-secondary" onClick={reset} disabled={isLoading}>Cancelar</button>
                {currentIndex > 0 && (
                  <button type="button" className="btn btn-soft btn-secondary gap-2" onClick={handlePreviousRow} disabled={isLoading}>
                    <span className="icon-[tabler--arrow-left] size-4" aria-hidden="true" />
                    Despesa anterior
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" className="btn btn-soft btn-secondary" onClick={handleSkipRow} disabled={isLoading}>Pular linha</button>
                <button type="button" className="btn btn-primary gap-2" onClick={handleConfirmRow} disabled={isLoading}>
                  {isLoading ? <span className="loading loading-spinner loading-xs" aria-hidden="true" /> : <span className="icon-[tabler--check] size-4" aria-hidden="true" />}
                  {currentIndex === rows.length - 1 ? "Confirmar e salvar" : "Confirmar e proxima"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8">
      <header className="space-y-2">
        <span className="badge badge-soft badge-primary">Importacao</span>
        <h1 className="text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">Importar fatura ou extrato</h1>
        <p className="max-w-2xl text-base text-base-content/60">Leia um arquivo CSV, revise as classificacoes sugeridas e registre as despesas no household {householdName}.</p>
      </header>
      <div className="card bg-base-100 shadow-md">
        <div className="card-body gap-6">
          <div>
            <h2 className="card-title text-xl">Configurar arquivo</h2>
            <p className="text-sm text-base-content/60">Formatos suportados: XP, BTG e Banco do Brasil.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(sourceLabels) as ImportSource[]).map((item) => (
              <button key={item} type="button" className={`btn ${source === item ? "btn-primary" : "btn-soft btn-secondary"} min-h-14 justify-start gap-3`} onClick={() => setSource(item)}>
                <span className="icon-[tabler--building-bank] size-5" aria-hidden="true" />
                <span className="text-left"><span className="block font-semibold">{sourceLabels[item]}</span><span className="block text-xs opacity-70">{item === "BB" ? "Extrato bancario" : "Fatura de cartao"}</span></span>
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="form-control w-full">
              <span className="label-text mb-1 font-medium">{source === "BB" ? "Data de referencia (opcional)" : "Competencia da fatura"}</span>
              <input type="date" className="input input-bordered w-full" value={statementDate} onChange={(event) => setStatementDate(event.target.value)} disabled={!source || source === "BB"} />
              <span className="label-text-alt mt-1 text-base-content/50">{source === "BB" ? "As datas serao lidas de cada lancamento." : "Essa data sera usada como competencia mensal."}</span>
            </label>
            <label className="form-control w-full">
              <span className="label-text mb-1 font-medium">Responsavel deste arquivo</span>
              <select className="select select-bordered w-full" value={responsibleUserId} onChange={(event) => setResponsibleUserId(event.target.value)}>
                <option value="">Selecione</option>
                {options.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
              <span className="label-text-alt mt-1 text-base-content/50">O mesmo responsavel sera sugerido para todas as linhas.</span>
            </label>
          </div>
          <label className="form-control w-full">
            <span className="label-text mb-1 font-medium">Arquivo CSV</span>
            <input type="file" accept=".csv,text/csv" className="file-input file-input-bordered w-full" onChange={handleFileChange} />
            {fileName && <span className="label-text-alt mt-1 text-success">{fileName} carregado{detectedSource ? ` · formato detectado: ${sourceLabels[detectedSource]}` : ""}</span>}
          </label>
          <div className="rounded-box border border-base-300 bg-base-200/40 p-4 text-sm text-base-content/70">
            <div className="flex items-start gap-3"><span className="icon-[tabler--shield-check] mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><p>A importacao nao grava nada nesta etapa. Cada linha sera revisada, categorizada e confirmada antes do salvamento.</p></div>
          </div>
          {error && <div className="alert alert-error"><span>{error}</span></div>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <a href="/despesas" className="btn btn-soft btn-secondary">Cancelar</a>
            <button type="button" className="btn btn-primary gap-2" onClick={handleStartReview} disabled={isLoading}>
              {isLoading ? <span className="loading loading-spinner loading-xs" aria-hidden="true" /> : <span className="icon-[tabler--file-search] size-4" aria-hidden="true" />}
              {isLoading ? "Lendo arquivo..." : "Ler e revisar"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

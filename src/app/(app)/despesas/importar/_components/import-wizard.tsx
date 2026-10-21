"use client";

import { ArrowLeftIcon, CheckIcon, CopyIcon, FileSearchIcon, LandmarkIcon, ReceiptTextIcon, ShieldCheckIcon, TriangleAlertIcon } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Badge } from "@/src/components/ui/badge";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/src/components/ui/native-select";
import { Spinner } from "@/src/components/ui/spinner";
import {
  decodeCsvBytes,
  detectCsvSource,
  type IgnoredImportRow,
  type ImportSource,
  type ParsedImportRow,
} from "@/src/lib/imports";
import { normalizeBtgXlsx } from "@/src/lib/imports/btg-xlsx";

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
    shared: row.source === "XP",
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
  const [btgWorkbookFile, setBtgWorkbookFile] = useState<File | null>(null);
  const [filePassword, setFilePassword] = useState("");
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

  function handleSourceChange(nextSource: ImportSource) {
    setSource(nextSource);
    setFileName("");
    setFileContent("");
    setBtgWorkbookFile(null);
    setFilePassword("");
    setDetectedSource(null);
    setError("");
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";

    setFileName("");
    setFileContent("");
    setBtgWorkbookFile(null);
    setFilePassword("");
    setDetectedSource(null);
    setError("");

    if (!file) {
      return;
    }

    if (!source) {
      setError("Selecione a instituicao antes de escolher o arquivo.");
      return;
    }

    if (source === "BTG") {
      if (!file.name.toLowerCase().endsWith(".xlsx")) {
        setError("Para o BTG, selecione um arquivo XLSX.");
        return;
      }
      if (file.size > 5_000_000) {
        setError("O XLSX deve ter no maximo 5 MB.");
        return;
      }

      setBtgWorkbookFile(file);
      setFileName(file.name);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Para esta instituicao, selecione um arquivo CSV.");
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
    if (!source || !fileName || !responsibleUserId) {
      setError("Selecione a instituicao, o responsavel e um arquivo.");
      return;
    }
    if (source === "BTG" && !btgWorkbookFile) {
      setError("Selecione o arquivo XLSX da fatura BTG.");
      return;
    }
    if (source !== "BTG" && !fileContent) {
      setError("Selecione o arquivo CSV da fatura ou extrato.");
      return;
    }
    if (source === "BTG" && !filePassword) {
      setError("Informe a senha da fatura BTG.");
      return;
    }
    if ((source === "XP" || source === "BTG") && !statementDate) {
      setError("Informe a competencia da fatura.");
      return;
    }
    if (source !== "BTG" && detectedSource && detectedSource !== source) {
      setError(`O arquivo parece ser da ${sourceLabels[detectedSource]}.`);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      let content = fileContent;
      if (source === "BTG") {
        if (!btgWorkbookFile) {
          throw new Error("Selecione o arquivo XLSX da fatura BTG.");
        }
        content = await normalizeBtgXlsx(btgWorkbookFile, filePassword);
      }
      const response = await parseImportAction({
        source,
        fileName,
        content,
        statementDate: statementDate || null,
      });

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
      setFileContent("");
      setBtgWorkbookFile(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel ler o arquivo.",
      );
    } finally {
      setFilePassword("");
      setIsLoading(false);
    }
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
    setBtgWorkbookFile(null);
    setFilePassword("");
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
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col items-start gap-2">
          <Badge variant="secondary">Importacao</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Importacao concluida</h1>
          <p className="text-base text-muted-foreground">O lote foi registrado no household {householdName}.</p>
        </header>
        <Card>
          <CardContent className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <ResultStat title="Importadas" value={result.importedRows} />
              <ResultStat title="Ignoradas" value={result.ignoredRows} />
              <ResultStat title="Puladas" value={result.skippedRows} />
              <ResultStat title="Falhas" value={result.failedRows} />
            </div>
            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <TriangleAlertIcon aria-hidden="true" />
                <AlertTitle>Algumas linhas nao foram gravadas.</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc ps-5">
                    {result.errors.slice(0, 8).map((message) => <li key={message}>{message}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <a href="/despesas" className={buttonVariants()}>
                <ReceiptTextIcon data-icon="inline-start" aria-hidden="true" />
                Ver despesas
              </a>
              <Button type="button" variant="secondary" onClick={reset}>
                Importar outro arquivo
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (step === "review" && currentRow) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-start gap-2">
            <Badge variant="secondary">Revisao de importacao</Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Confirme cada lançamento</h1>
            <p className="text-base text-muted-foreground">As sugestoes preenchem a linha, mas nada sera salvo sem sua confirmacao.</p>
          </div>
          <div className="text-sm text-muted-foreground">{currentIndex + 1} de {rows.length}</div>
        </header>
        <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={1} aria-valuemax={rows.length} aria-valuenow={currentIndex + 1}>
          <div className="h-full bg-primary transition-all" style={{ width: `${((currentIndex + 1) / rows.length) * 100}%` }} />
        </div>
        <Card>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]">
                <Field>
                  <FieldLabel htmlFor="import-description">Descricao</FieldLabel>
                  <Input id="import-description" value={currentRow.description} onChange={(event) => updateCurrentRow({ description: event.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="import-amount">Valor</FieldLabel>
                  <Input id="import-amount" inputMode="decimal" value={currentRow.amount} onChange={(event) => updateCurrentRow({ amount: event.target.value })} />
                </Field>
                <Field>
                  <FieldTitle>Origem</FieldTitle>
                  <div className="flex h-8 items-center rounded-lg border bg-muted/50 px-2.5 text-sm text-muted-foreground">{sourceLabels[currentRow.source]}</div>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Data da compra</p>
                  <p className="mt-1 font-medium">{formatDate(currentRow.transactionDate)}</p>
                  {currentRow.installment && <p className="mt-1 text-sm text-muted-foreground">Parcela {currentRow.installment.current}/{currentRow.installment.total}</p>}
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Competencia</p>
                  <p className="mt-1 font-medium">{parseData?.statementDate ? formatDate(parseData.statementDate) : "Data do extrato"}</p>
                  {currentRow.cardholder && <p className="mt-1 text-sm text-muted-foreground">Portador: {currentRow.cardholder}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Sugestao do historico</h2>
                    <p className="text-sm text-muted-foreground">Escolha uma sugestao ou classifique manualmente.</p>
                  </div>
                  {isLoadingHelpers && <Spinner aria-label="Carregando" />}
                </div>
                {suggestionError && <p className="text-sm text-destructive">{suggestionError}</p>}
                {!isLoadingHelpers && !visibleSuggestionError && visibleSuggestions.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma despesa semelhante encontrada.</p>}
                <div className="grid gap-2">
                  {visibleSuggestions.map((suggestion) => (
                    <button
                      type="button"
                      key={`${suggestion.areaCategoryId}-${suggestion.areaSubcategoryId}-${suggestion.profileCategoryId}`}
                      className="rounded-lg border bg-muted/40 px-3 py-2 text-left transition-colors hover:border-primary hover:bg-primary/5"
                      onClick={() => updateCurrentRow({
                        areaCategoryId: suggestion.areaCategoryId,
                        areaSubcategoryId: suggestion.areaSubcategoryId,
                        profileCategoryId: suggestion.profileCategoryId,
                        notes: currentRow.notes || suggestion.notes,
                      })}
                    >
                      <span className="block text-sm font-medium">{suggestion.areaCategoryName} / {suggestion.areaSubcategoryName} / {suggestion.profileCategoryName}</span>
                      <span className="text-xs text-muted-foreground">{suggestion.source} · {Math.round(suggestion.confidence * 100)}% de confianca · {suggestion.matchCount} ocorrencia(s) · {suggestion.matchedDescription}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="import-area">Categoria de area</FieldLabel>
                  <NativeSelect id="import-area" className="w-full" value={currentRow.areaCategoryId} onChange={(event) => updateCurrentAreaCategory(event.target.value)}>
                    <NativeSelectOption value="">Selecione</NativeSelectOption>
                    {options.areaCategories.map((category) => <NativeSelectOption key={category.id} value={category.id}>{category.name}</NativeSelectOption>)}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="import-subcategory">Subcategoria</FieldLabel>
                  <NativeSelect id="import-subcategory" className="w-full" value={currentRow.areaSubcategoryId} disabled={!currentRow.areaCategoryId} onChange={(event) => updateCurrentRow({ areaSubcategoryId: event.target.value })}>
                    <NativeSelectOption value="">Selecione</NativeSelectOption>
                    {selectedSubcategories.map((subcategory) => <NativeSelectOption key={subcategory.id} value={subcategory.id}>{subcategory.name}</NativeSelectOption>)}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="import-profile">Categoria de perfil</FieldLabel>
                  <NativeSelect id="import-profile" className="w-full" value={currentRow.profileCategoryId} onChange={(event) => updateCurrentRow({ profileCategoryId: event.target.value })}>
                    <NativeSelectOption value="">Selecione</NativeSelectOption>
                    {options.profileCategories.map((category) => <NativeSelectOption key={category.id} value={category.id}>{category.name}</NativeSelectOption>)}
                  </NativeSelect>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldTitle>Responsavel</FieldTitle>
                  <div className="flex h-8 items-center rounded-lg border bg-muted/50 px-2.5 text-sm text-muted-foreground">
                    {options.members.find((member) => member.id === responsibleUserId)?.name ?? "Responsavel selecionado"}
                  </div>
                  <FieldDescription>Definido para todo o arquivo.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="import-notes">Observacoes</FieldLabel>
                  <Input id="import-notes" value={currentRow.notes} onChange={(event) => updateCurrentRow({ notes: event.target.value })} placeholder="Opcional" />
                </Field>
              </div>
              {visibleDuplicates.length > 0 && (
                <Alert>
                  <CopyIcon aria-hidden="true" />
                  <AlertTitle>Possivel duplicidade</AlertTitle>
                  <AlertDescription>
                    <p>Ja existe um lancamento com a mesma descricao, valor e data ou fingerprint.</p>
                    {visibleDuplicates.map((duplicate) => (
                      <p key={duplicate.id} className="mt-2 text-xs">{duplicate.description} · {formatCurrency(duplicate.amount)} · {formatDate(duplicate.statementDate)}{duplicate.fileName ? ` · ${duplicate.fileName}` : ""}</p>
                    ))}
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Checkbox id="import-allow-duplicate" checked={currentRow.allowDuplicateImport} onCheckedChange={(checked) => updateCurrentRow({ allowDuplicateImport: checked === true })} />
                      <Label htmlFor="import-allow-duplicate">Importar mesmo assim</Label>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              {visibleDuplicateError && <p className="text-sm text-destructive">{visibleDuplicateError}</p>}
              <div className="flex flex-wrap gap-4">
                <Field orientation="horizontal" className="w-auto">
                  <Checkbox id="import-shared" checked={currentRow.shared} onCheckedChange={(checked) => updateCurrentRow({ shared: checked === true })} />
                  <FieldLabel htmlFor="import-shared">Compartilhada</FieldLabel>
                </Field>
                <Field orientation="horizontal" className="w-auto">
                  <Checkbox id="import-recurring" checked={currentRow.recurring} onCheckedChange={(checked) => updateCurrentRow({ recurring: checked === true })} />
                  <FieldLabel htmlFor="import-recurring">Recorrente</FieldLabel>
                </Field>
              </div>
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="button" variant="secondary" onClick={reset} disabled={isLoading}>Cancelar</Button>
                  <Button type="button" variant="secondary" onClick={handleSkipRow} disabled={isLoading}>Pular linha</Button>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {currentIndex > 0 && (
                    <Button type="button" variant="secondary" onClick={handlePreviousRow} disabled={isLoading}>
                      <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
                      Despesa anterior
                    </Button>
                  )}
                  <Button type="button" onClick={handleConfirmRow} disabled={isLoading}>
                    {isLoading ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" aria-hidden="true" />}
                    {currentIndex === rows.length - 1 ? "Confirmar e salvar" : "Confirmar e proxima"}
                  </Button>
                </div>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex flex-col items-start gap-2">
        <Badge variant="secondary">Importacao</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Importar fatura ou extrato</h1>
        <p className="max-w-2xl text-base text-muted-foreground">Leia o arquivo da instituicao, revise as classificacoes sugeridas e registre as despesas no household {householdName}.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Configurar arquivo</CardTitle>
          <CardDescription>BTG: XLSX protegido por senha. XP e Banco do Brasil: CSV.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(sourceLabels) as ImportSource[]).map((item) => (
                <Button key={item} type="button" variant={source === item ? "default" : "secondary"} className="h-14 justify-start gap-3" onClick={() => handleSourceChange(item)} disabled={isLoading}>
                  <LandmarkIcon aria-hidden="true" />
                  <span className="text-left"><span className="block font-semibold">{sourceLabels[item]}</span><span className="block text-xs opacity-70">{item === "BB" ? "Extrato bancario" : "Fatura de cartao"}</span></span>
                </Button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="import-statement-date">{source === "BB" ? "Data de referencia (opcional)" : "Competencia da fatura"}</FieldLabel>
                <Input id="import-statement-date" type="date" value={statementDate} onChange={(event) => setStatementDate(event.target.value)} disabled={!source || source === "BB"} />
                <FieldDescription>{source === "BB" ? "As datas serao lidas de cada lancamento." : "Essa data sera usada como competencia mensal."}</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="import-responsible">Responsavel deste arquivo</FieldLabel>
                <NativeSelect id="import-responsible" className="w-full" value={responsibleUserId} onChange={(event) => setResponsibleUserId(event.target.value)}>
                  <NativeSelectOption value="">Selecione</NativeSelectOption>
                  {options.members.map((member) => <NativeSelectOption key={member.id} value={member.id}>{member.name}</NativeSelectOption>)}
                </NativeSelect>
                <FieldDescription>O mesmo responsavel sera sugerido para todas as linhas.</FieldDescription>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="import-file">{source === "BTG" ? "Arquivo XLSX BTG" : "Arquivo CSV"}</FieldLabel>
              <Input
                key={source}
                id="import-file"
                type="file"
                accept={source === "BTG" ? ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : ".csv,text/csv"}
                onChange={handleFileChange}
                disabled={!source || isLoading}
              />
              {fileName && <FieldDescription>{fileName} carregado{detectedSource ? ` · formato detectado: ${sourceLabels[detectedSource]}` : ""}</FieldDescription>}
            </Field>
            {source === "BTG" && (
              <Field>
                <FieldLabel htmlFor="import-file-password">Senha da fatura BTG</FieldLabel>
                <Input
                  id="import-file-password"
                  type="password"
                  autoComplete="off"
                  inputMode="numeric"
                  value={filePassword}
                  onChange={(event) => setFilePassword(event.target.value)}
                  disabled={!btgWorkbookFile || isLoading}
                />
                <FieldDescription>
                  Usada somente no navegador para abrir o XLSX; nao sera salva.
                </FieldDescription>
              </Field>
            )}
            <Alert>
              <ShieldCheckIcon aria-hidden="true" />
              <AlertDescription>A importacao nao grava nada nesta etapa. Cada linha sera revisada, categorizada e confirmada antes do salvamento.</AlertDescription>
            </Alert>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <a href="/despesas" className={buttonVariants({ variant: "secondary" })}>Cancelar</a>
              <Button type="button" onClick={handleStartReview} disabled={isLoading}>
                {isLoading ? <Spinner data-icon="inline-start" /> : <FileSearchIcon data-icon="inline-start" aria-hidden="true" />}
                {isLoading ? "Lendo arquivo..." : "Ler e revisar"}
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
    </section>
  );
}

function ResultStat({ title, value }: { title: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted px-4 py-3">
      <span className="text-sm text-muted-foreground">{title}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
}

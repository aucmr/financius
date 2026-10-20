import { normalizeText } from "@/src/lib/imports";

export type SuggestionCandidate = {
  description: string;
  notes: string | null;
  importBatchId: string | null;
  importMetadata: unknown;
  areaCategoryId: string;
  areaCategoryName: string;
  areaSubcategoryId: string;
  areaSubcategoryName: string;
  profileCategoryId: string;
  profileCategoryName: string;
};

export type ExpenseImportSuggestion = {
  areaCategoryId: string;
  areaCategoryName: string;
  areaSubcategoryId: string;
  areaSubcategoryName: string;
  profileCategoryId: string;
  profileCategoryName: string;
  notes: string;
  confidence: number;
  matchCount: number;
  source: "EXACT" | "TRIGRAM";
  matchedDescription: string;
};

function isMetadataRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getGeneratedImportNotes(metadata: unknown) {
  if (!isMetadataRecord(metadata)) {
    return new Set<string>();
  }

  const generatedNotes = new Set<string>();
  const fields = [
    ["cardholder", "Portador"],
    ["installment", "Parcela"],
    ["authorizationCode", "Autorizacao"],
    ["documentNumber", "Documento/cartao"],
  ] as const;

  for (const [field, label] of fields) {
    const value = metadata[field];
    if (typeof value === "string" && value) {
      generatedNotes.add(`${label}: ${value}`);
    }
  }

  return generatedNotes;
}

function getSuggestionNotes(candidate: SuggestionCandidate) {
  const notes = candidate.notes ?? "";
  if (candidate.importBatchId === null && candidate.importMetadata === null) {
    return notes;
  }

  const generatedNotes = getGeneratedImportNotes(candidate.importMetadata);
  if (generatedNotes.size === 0) {
    return notes;
  }

  return notes
    .split(" | ")
    .filter((segment) => !generatedNotes.has(segment.trim()))
    .join(" | ");
}

function getTrigrams(value: string) {
  const normalized = `  ${normalizeText(value)}  `;
  const trigrams = new Set<string>();
  for (let index = 0; index <= normalized.length - 3; index += 1) {
    trigrams.add(normalized.slice(index, index + 3));
  }
  return trigrams;
}

function similarity(left: string, right: string) {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  if (!normalizedLeft || !normalizedRight) {
    return 0;
  }
  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  const leftTrigrams = getTrigrams(normalizedLeft);
  const rightTrigrams = getTrigrams(normalizedRight);
  const intersection = Array.from(leftTrigrams).filter((value) =>
    rightTrigrams.has(value),
  ).length;
  const union = new Set([...leftTrigrams, ...rightTrigrams]).size;
  return union === 0 ? 0 : intersection / union;
}

export function rankExpenseSuggestions(
  description: string,
  candidates: SuggestionCandidate[],
  limit = 3,
) {
  const groups = new Map<
    string,
    {
      score: number;
      exact: boolean;
      candidate: SuggestionCandidate;
      matchCount: number;
    }
  >();

  for (const candidate of candidates) {
    const score = similarity(description, candidate.description);
    if (score < 0.12) {
      continue;
    }

    const key = [
      candidate.areaCategoryId,
      candidate.areaSubcategoryId,
      candidate.profileCategoryId,
    ].join("|");
    const existing = groups.get(key);
    const isExact = score === 1;

    if (!existing) {
      groups.set(key, {
        score,
        exact: isExact,
        candidate,
        matchCount: 1,
      });
      continue;
    }

    existing.matchCount += 1;
    if (score > existing.score) {
      existing.score = score;
      existing.candidate = candidate;
    }
    existing.exact ||= isExact;
  }

  return Array.from(groups.values())
    .sort(
      (left, right) =>
        right.score - left.score || right.matchCount - left.matchCount,
    )
    .slice(0, limit)
    .map(({ score, exact, candidate, matchCount }) => ({
      areaCategoryId: candidate.areaCategoryId,
      areaCategoryName: candidate.areaCategoryName,
      areaSubcategoryId: candidate.areaSubcategoryId,
      areaSubcategoryName: candidate.areaSubcategoryName,
      profileCategoryId: candidate.profileCategoryId,
      profileCategoryName: candidate.profileCategoryName,
      notes: getSuggestionNotes(candidate),
      confidence: Number(score.toFixed(4)),
      matchCount,
      source: exact ? ("EXACT" as const) : ("TRIGRAM" as const),
      matchedDescription: candidate.description,
    }));
}

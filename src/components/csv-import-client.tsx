"use client";

import { useState } from "react";
import { CSVExpenseReview } from "@/components/csv-expense-review";
import {
  parseCSVImport,
  createBatchExpenses,
  getAllUsers,
  getCategories,
  detectBankFormat,
  type ImportExpenseData,
} from "@/actions/csv-import";
import type { ParsedExpenseRow } from "@/lib/csv-parser";

type Step = "upload" | "review" | "results";

type CategoryOption = {
  id: string;
  name: string;
};

type UserOption = {
  id: string;
  name: string;
};

export function ImportCSVClient() {
  const [step, setStep] = useState<Step>("upload");
  const [selectedBank, setSelectedBank] = useState<"XP" | "BTG" | "">("");
  const [dueDate, setDueDate] = useState("");
  const [csvContent, setCSVContent] = useState("");
  const [parsedExpenses, setParsedExpenses] = useState<ParsedExpenseRow[]>([]);
  const [currentExpenseIndex, setCurrentExpenseIndex] = useState(0);
  const [confirmedExpenses, setConfirmedExpenses] = useState<ImportExpenseData[]>(
    [],
  );
  const [areaCategories, setAreaCategories] = useState<CategoryOption[]>([]);
  const [profileCategories, setProfileCategories] = useState<CategoryOption[]>(
    [],
  );
  const [responsibleUsers, setResponsibleUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setCSVContent(content);

      // Auto-detect bank format
      try {
        const detectedBank = await detectBankFormat(content);
        if (detectedBank) {
          setSelectedBank(detectedBank);
        }
      } catch {
        // Silently fail auto-detection, user can manually select
      }
    };
    reader.readAsText(file);
  };

  const handleStartReview = async () => {
    if (!selectedBank || !dueDate || !csvContent) {
      setError("Please select a bank, due date, and upload a CSV file");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Parse CSV and fetch data
      const [expenses, userData, categoryData] = await Promise.all([
        parseCSVImport(csvContent, selectedBank),
        getAllUsers(),
        getCategories(),
      ]);

      if (expenses.length === 0) {
        setError("No valid expenses found in the CSV file");
        setIsLoading(false);
        return;
      }

      setParsedExpenses(expenses);
      setResponsibleUsers(userData);
      setAreaCategories(categoryData.areaCategories);
      setProfileCategories(categoryData.profileCategories);
      setCurrentExpenseIndex(0);
      setConfirmedExpenses([]);
      setStep("review");
    } catch (err) {
      setError(
        `Failed to parse CSV: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmExpense = (data: {
    description: string;
    amount: number;
    areaCategoryId: string;
    profileCategoryId: string;
    responsibleUserId: string;
    notes: string;
    shared: boolean;
    recurring: boolean;
  }) => {
    const expenseData: ImportExpenseData = {
      ...data,
      date: dueDate,
    };

    setConfirmedExpenses([...confirmedExpenses, expenseData]);

    if (currentExpenseIndex < parsedExpenses.length - 1) {
      setCurrentExpenseIndex(currentExpenseIndex + 1);
    } else {
      handleFinishReview();
    }
  };

  const handleSkipExpense = () => {
    if (currentExpenseIndex < parsedExpenses.length - 1) {
      setCurrentExpenseIndex(currentExpenseIndex + 1);
    } else {
      handleFinishReview();
    }
  };

  const handleFinishReview = async () => {
    if (confirmedExpenses.length === 0) {
      setError("No expenses to save");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await createBatchExpenses(confirmedExpenses);
      setResults(result);
      setStep("results");
    } catch (err) {
      setError(
        `Failed to save expenses: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setStep("upload");
    setSelectedBank("");
    setDueDate("");
    setCSVContent("");
    setParsedExpenses([]);
    setConfirmedExpenses([]);
    setCurrentExpenseIndex(0);
    setError("");
  };

  const handleReset = () => {
    handleCancel();
    setResults(null);
  };

  // Render upload step
  if (step === "upload") {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Import Credit Card Statement
          </h2>

          {/* Bank Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Financial Institution
            </label>
            <div className="grid grid-cols-2 gap-4">
              {(["XP", "BTG"] as const).map((bank) => (
                <button
                  key={bank}
                  onClick={() => setSelectedBank(bank)}
                  className={`p-4 border-2 rounded-lg font-medium transition-all ${selectedBank === bank
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                >
                  {bank}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date Selection */}
          <div>
            <label
              htmlFor="dueDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Credit Card Bill Due Date
            </label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              This date will be applied to all imported expenses
            </p>
          </div>

          {/* CSV File Upload */}
          <div>
            <label
              htmlFor="csvFile"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Upload CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full"
              />
              {csvContent && (
                <p className="mt-2 text-sm text-green-600 font-medium">
                  ✓ CSV file loaded
                </p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <button
            onClick={handleStartReview}
            disabled={!selectedBank || !dueDate || !csvContent || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg px-4 py-2"
          >
            {isLoading ? "Loading..." : "Review Expenses"}
          </button>
        </div>
      </div>
    );
  }

  // Render review step
  if (step === "review" && currentExpenseIndex < parsedExpenses.length) {
    const currentExpense = parsedExpenses[currentExpenseIndex];

    return (
      <div className="w-full max-w-2xl mx-auto">
        <CSVExpenseReview
          currentIndex={currentExpenseIndex}
          totalCount={parsedExpenses.length}
          parsedDescription={currentExpense.description}
          parsedAmount={currentExpense.amount}
          dueDate={dueDate}
          areaCategories={areaCategories}
          profileCategories={profileCategories}
          responsibleUsers={responsibleUsers}
          onConfirm={handleConfirmExpense}
          onSkip={handleSkipExpense}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    );
  }

  // Render results step
  if (step === "results" && results) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Import Complete</h2>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800">
                ✓ Successfully saved: <span className="font-bold">{results.success}</span>{" "}
                expenses
              </p>
            </div>

            {results.failed > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  ⚠ Failed to save: <span className="font-bold">{results.failed}</span>{" "}
                  expenses
                </p>
                {results.errors.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {results.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx} className="text-xs text-yellow-700">
                        {err}
                      </li>
                    ))}
                    {results.errors.length > 5 && (
                      <li className="text-xs text-yellow-700">
                        ... and {results.errors.length - 5} more
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleReset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2"
          >
            Import Another File
          </button>
        </div>
      </div>
    );
  }

  return null;
}

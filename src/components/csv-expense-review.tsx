"use client";

import { useState, useEffect } from "react";

type CategoryOption = {
  id: string;
  name: string;
};

type UserOption = {
  id: string;
  name: string;
};

type CSVExpenseReviewProps = {
  currentIndex: number;
  totalCount: number;
  parsedDescription: string;
  parsedAmount: number;
  dueDate: string;
  areaCategories: CategoryOption[];
  profileCategories: CategoryOption[];
  responsibleUsers: UserOption[];
  onConfirm: (data: {
    description: string;
    amount: number;
    areaCategoryId: string;
    profileCategoryId: string;
    responsibleUserId: string;
    notes: string;
    shared: boolean;
    recurring: boolean;
  }) => void;
  onSkip: () => void;
  onCancel: () => void;
  isLoading: boolean;
};

export function CSVExpenseReview({
  currentIndex,
  totalCount,
  parsedDescription,
  parsedAmount,
  dueDate,
  areaCategories,
  profileCategories,
  responsibleUsers,
  onConfirm,
  onSkip,
  onCancel,
  isLoading,
}: CSVExpenseReviewProps) {
  const [description, setDescription] = useState(parsedDescription);
  const [amount, setAmount] = useState(parsedAmount.toString());
  const [areaCategoryId, setAreaCategoryId] = useState("");
  const [profileCategoryId, setProfileCategoryId] = useState("");
  const [responsibleUserId, setResponsibleUserId] = useState(
    responsibleUsers[0]?.id || "",
  );
  const [notes, setNotes] = useState("");
  const [shared, setShared] = useState(true);
  const [recurring, setRecurring] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when current expense changes
  useEffect(() => {
    setDescription(parsedDescription);
    setAmount(parsedAmount.toString());
    setAreaCategoryId("");
    setProfileCategoryId("");
    setResponsibleUserId(responsibleUsers[0]?.id || "");
    setNotes("");
    setShared(true);
    setRecurring(false);
    setErrors({});
  }, [currentIndex, parsedDescription, parsedAmount, responsibleUsers]);

  const handleConfirm = () => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = "Amount must be greater than zero";
    }

    if (!areaCategoryId) {
      newErrors.areaCategoryId = "Area category is required";
    }

    if (!profileCategoryId) {
      newErrors.profileCategoryId = "Profile category is required";
    }

    if (!responsibleUserId) {
      newErrors.responsibleUserId = "Responsible user is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onConfirm({
      description: description.trim(),
      amount: parseFloat(amount),
      areaCategoryId,
      profileCategoryId,
      responsibleUserId,
      notes: notes.trim(),
      shared,
      recurring,
    });
  };

  const progressPercent = Math.round(((currentIndex + 1) / totalCount) * 100);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">
            Expense {currentIndex + 1} of {totalCount}
          </h3>
          <span className="text-xs font-medium text-gray-500">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.description ? "border-red-500" : "border-gray-300"
              }`}
            placeholder="Expense description"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Amount */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Amount (BRL)
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.amount ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Date (read-only) */}
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date (Bill Due Date)
            </label>
            <input
              id="date"
              type="date"
              value={dueDate}
              disabled
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="areaCategory"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Area Category
            </label>
            <select
              id="areaCategory"
              value={areaCategoryId}
              onChange={(e) => setAreaCategoryId(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-white ${errors.areaCategoryId ? "border-red-500" : "border-gray-300"
                }`}
            >
              <option value="">Select an option</option>
              {areaCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.areaCategoryId && (
              <p className="mt-1 text-xs text-red-600">
                {errors.areaCategoryId}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="profileCategory"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Profile Category
            </label>
            <select
              id="profileCategory"
              value={profileCategoryId}
              onChange={(e) => setProfileCategoryId(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-white ${errors.profileCategoryId ? "border-red-500" : "border-gray-300"
                }`}
            >
              <option value="">Select an option</option>
              {profileCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.profileCategoryId && (
              <p className="mt-1 text-xs text-red-600">
                {errors.profileCategoryId}
              </p>
            )}
          </div>
        </div>

        {/* Responsible User */}
        <div>
          <label
            htmlFor="responsible"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Responsible
          </label>
          <select
            id="responsible"
            value={responsibleUserId}
            onChange={(e) => setResponsibleUserId(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-sm bg-white ${errors.responsibleUserId ? "border-red-500" : "border-gray-300"
              }`}
          >
            {responsibleUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          {errors.responsibleUserId && (
            <p className="mt-1 text-xs text-red-600">
              {errors.responsibleUserId}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            rows={3}
            placeholder="Add any notes..."
          />
        </div>

        {/* Checkboxes */}
        <div className="space-y-2 pb-3 space-x-6">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={shared}
              onChange={(e) => setShared(e.target.checked)}
              className="rounded border-gray-300"
            />
            Shared between husband and wife
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="rounded border-gray-300"
            />
            Recurring expense
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg px-4 py-2 text-sm"
          >
            {isLoading ? "Saving..." : "Confirm & Next"}
          </button>

          <button
            onClick={onSkip}
            disabled={isLoading}
            className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 font-medium rounded-lg px-4 py-2 text-sm"
          >
            Skip
          </button>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

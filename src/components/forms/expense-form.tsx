"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  expenseFormSchema,
  type ExpenseFormValues,
} from "@/lib/validations/expense";

type CategoryOption = {
  id: string;
  name: string;
};

type ExpenseFormProps = {
  areaCategories: CategoryOption[];
  profileCategories: CategoryOption[];
  responsibleUsers: CategoryOption[];
  onSubmitAction: (values: ExpenseFormValues) => Promise<void>;
};

export function ExpenseForm({
  areaCategories,
  profileCategories,
  responsibleUsers,
  onSubmitAction,
}: ExpenseFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: "",
      date: "",
      areaCategoryId: "",
      profileCategoryId: "",
      responsibleUserId: "",
      notes: "",
      recurring: false,
      shared: false,
    },
  });

  async function onSubmit(values: ExpenseFormValues) {
    setSubmitError("");
    try {
      await onSubmitAction(values);
      reset({
        description: "",
        date: "",
        areaCategoryId: "",
        profileCategoryId: "",
        responsibleUserId: "",
        notes: "",
        recurring: false,
        shared: false,
      });
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message);
        return;
      }

      setSubmitError("Unable to create expense. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <input
          id="description"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          {...register("description")}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Notes
        </label>
        <input
          id="notes"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          {...register("notes")}
        />
      </div>

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
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          {...register("amount", { valueAsNumber: true })}
        />
        {errors.amount && (
          <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="date"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Date
        </label>
        <input
          id="date"
          type="date"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          {...register("date")}
        />
        {errors.date && (
          <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="areaCategoryId"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Area category
        </label>
        <select
          id="areaCategoryId"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          {...register("areaCategoryId")}
        >
          <option value="">Select an option</option>
          {areaCategories.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {errors.areaCategoryId && (
          <p className="mt-1 text-xs text-red-600">
            {errors.areaCategoryId.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="profileCategoryId"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Profile category
        </label>
        <select
          id="profileCategoryId"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          {...register("profileCategoryId")}
        >
          <option value="">Select an option</option>
          {profileCategories.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {errors.profileCategoryId && (
          <p className="mt-1 text-xs text-red-600">
            {errors.profileCategoryId.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="responsibleUserId"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Responsible
        </label>
        <select
          id="responsibleUserId"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          {...register("responsibleUserId")}
        >
          <option value="">Select a person</option>
          {responsibleUsers.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {errors.responsibleUserId && (
          <p className="mt-1 text-xs text-red-600">
            {errors.responsibleUserId.message}
          </p>
        )}
      </div>

      <div className="flex flex-col justify-end">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="rounded border-gray-300"
            {...register("shared")}
          />
          Shared between husband and wife
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="rounded border-gray-300"
            {...register("recurring")}
          />
          Recurring expense
        </label>
      </div>

      {submitError && (
        <p role="alert" className="md:col-span-2 text-sm text-red-600">
          {submitError}
        </p>
      )}

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg px-4 py-2 text-sm"
        >
          {isSubmitting ? "Adding expense..." : "Add expense"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { incomeFormSchema, type IncomeFormValues } from "@/lib/validations/income";

type IncomeFormProps = {
  householdUsers: { id: string; name: string }[];
  onSubmitAction: (values: IncomeFormValues) => Promise<void>;
};

export function IncomeForm({ householdUsers, onSubmitAction }: IncomeFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      description: "",
      date: "",
      ownerUserId: "",
      notes: "",
      recurring: false,
    },
  });

  async function onSubmit(values: IncomeFormValues) {
    setSubmitError("");
    try {
      await onSubmitAction(values);
      reset({
        description: "",
        date: "",
        ownerUserId: "",
        notes: "",
        recurring: false,
      });
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message);
        return;
      }

      setSubmitError("Unable to create income entry. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          id="description"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          {...register("description")}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <input
          id="notes"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          {...register("notes")}
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
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
        {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <input
          id="date"
          type="date"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          {...register("date")}
        />
        {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>}
      </div>

      <div>
        <label htmlFor="ownerUserId" className="block text-sm font-medium text-gray-700 mb-1">
          Owner
        </label>
        <select
          id="ownerUserId"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
          {...register("ownerUserId")}
        >
          <option value="">Select a person</option>
          {householdUsers.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {errors.ownerUserId && (
          <p className="mt-1 text-xs text-red-600">{errors.ownerUserId.message}</p>
        )}
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" className="rounded border-gray-300" {...register("recurring")} />
        Recurring income
      </label>

      {submitError && (
        <p role="alert" className="md:col-span-2 text-sm text-red-600">
          {submitError}
        </p>
      )}

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg px-4 py-2 text-sm"
        >
          {isSubmitting ? "Adding income..." : "Add income"}
        </button>
      </div>
    </form>
  );
}

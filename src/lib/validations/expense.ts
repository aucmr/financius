import { z } from "zod";

function isValidDateString(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

export const expenseFormSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  amount: z
    .number()
    .finite("Amount is required")
    .positive("Amount must be greater than zero"),
  date: z
    .string()
    .min(1, "Date is required")
    .refine(isValidDateString, "Invalid date"),
  areaCategoryId: z.string().min(1, "Area category is required"),
  profileCategoryId: z.string().min(1, "Profile category is required"),
  responsibleUserId: z.string().min(1, "Responsible user is required"),
  shared: z.boolean(),
  notes: z.string().optional(),
  recurring: z.boolean().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

import { z } from "zod";

function isValidDateString(value: string) {
  return !Number.isNaN(new Date(value).getTime());
}

export const incomeFormSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  amount: z
    .number()
    .finite("Amount is required")
    .positive("Amount must be greater than zero"),
  date: z
    .string()
    .min(1, "Date is required")
    .refine(isValidDateString, "Invalid date"),
  ownerUserId: z.string().min(1, "Owner is required"),
  notes: z.string().optional(),
  recurring: z.boolean().optional(),
});

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;

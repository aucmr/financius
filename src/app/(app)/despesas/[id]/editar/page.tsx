import { notFound } from "next/navigation";

import { ExpenseFormPage } from "@/src/app/(app)/despesas/_components/expense-form-page";
import { getExpenseFormData } from "@/src/app/(app)/despesas/queries";

type EditExpensePageProps = {
    params: Promise<{ id: string }>;
};

export default async function EditExpensePage({ params }: EditExpensePageProps) {
    const { id } = await params;
    const data = await getExpenseFormData(id);

    if (!data.exists || !data.initialValues) {
        notFound();
    }

    return (
        <ExpenseFormPage
            mode="edit"
            expenseId={id}
            householdName={data.householdName}
            options={data.options}
            initialValues={data.initialValues}
        />
    );
}

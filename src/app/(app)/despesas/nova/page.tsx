import { ExpenseFormPage } from "@/src/app/(app)/despesas/_components/expense-form-page";
import { getExpenseFormData } from "@/src/app/(app)/despesas/queries";

export default async function NewExpensePage() {
    const data = await getExpenseFormData();

    return (
        <ExpenseFormPage
            mode="create"
            householdName={data.householdName}
            options={data.options}
            initialValues={data.initialValues!}
        />
    );
}

import { getCategories } from "@/actions/categories";
import { createExpense, getExpenses } from "@/actions/expenses";
import { getHouseholdUsers } from "@/actions/users";
import { ExpenseForm } from "@/components/forms/expense-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { type ExpenseFormValues } from "@/lib/validations/expense";
import { revalidatePath } from "next/cache";

async function createExpenseAction(values: ExpenseFormValues) {
  "use server";

  await createExpense(values);

  revalidatePath("/expenses");
}

export default async function ExpensesPage() {
  const [expenses, areaCategories, profileCategories, householdUsers] =
    await Promise.all([
      getExpenses(),
      getCategories("AREA"),
      getCategories("PROFILE"),
      getHouseholdUsers(),
    ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Expense</h2>
        <ExpenseForm
          areaCategories={areaCategories}
          profileCategories={profileCategories}
          responsibleUsers={householdUsers}
          onSubmitAction={createExpenseAction}
        />
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Latest Expenses
        </h2>
        {expenses.length === 0 ? (
          <p className="text-gray-500 text-sm">No expenses yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="py-2 pr-3">Description</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Area</th>
                  <th className="py-2 pr-3">Profile</th>
                  <th className="py-2 pr-3">Responsible</th>
                  <th className="py-2 pr-3">Shared</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-100">
                    <td className="py-2 pr-3">{expense.description}</td>
                    <td className="py-2 pr-3">
                      {formatCurrency(Number(expense.amount))}
                    </td>
                    <td className="py-2 pr-3">{formatDate(expense.date)}</td>
                    <td className="py-2 pr-3">{expense.areaCategory.name}</td>
                    <td className="py-2 pr-3">
                      {expense.profileCategory.name}
                    </td>
                    <td className="py-2 pr-3">
                      {expense.responsibleUser.name}
                    </td>
                    <td className="py-2 pr-3">
                      {expense.shared ? "✅" : "❌"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

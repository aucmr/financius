import { createIncome, getIncome } from "@/actions/income";
import { getHouseholdUsers } from "@/actions/users";
import { IncomeForm } from "@/components/forms/income-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { type IncomeFormValues } from "@/lib/validations/income";
import { revalidatePath } from "next/cache";

async function createIncomeAction(values: IncomeFormValues) {
  "use server";

  await createIncome(values);

  revalidatePath("/income");
}

export default async function IncomePage() {
  const [incomeEntries, householdUsers] = await Promise.all([
    getIncome(),
    getHouseholdUsers(),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Income</h2>
        <IncomeForm householdUsers={householdUsers} onSubmitAction={createIncomeAction} />
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Latest Income</h2>
        {incomeEntries.length === 0 ? (
          <p className="text-gray-500 text-sm">No income entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="py-2 pr-3">Description</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Owner</th>
                </tr>
              </thead>
              <tbody>
                {incomeEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100">
                    <td className="py-2 pr-3">{entry.description}</td>
                    <td className="py-2 pr-3">{formatCurrency(Number(entry.amount))}</td>
                    <td className="py-2 pr-3">{formatDate(entry.date)}</td>
                    <td className="py-2 pr-3">{entry.ownerUser.name}</td>
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

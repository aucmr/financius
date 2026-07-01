import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {session.user?.name}! 👋
        </h2>
        <p className="text-gray-500">
          Your shared household finance dashboard is ready. More features coming
          soon.
        </p>

        <div className="mt-6 flex gap-3">
          <a
            href="/expenses"
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Manage Expenses
          </a>
          <a
            href="/income"
            className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Manage Income
          </a>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border p-5 bg-green-50 border-green-100">
            <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
              Total Income
            </p>
            <p className="text-2xl font-bold text-green-700 mt-1">R$ 0,00</p>
          </div>
          <div className="rounded-xl border p-5 bg-red-50 border-red-100">
            <p className="text-xs font-medium text-red-600 uppercase tracking-wide">
              Total Expenses
            </p>
            <p className="text-2xl font-bold text-red-700 mt-1">R$ 0,00</p>
          </div>
          <div className="rounded-xl border p-5 bg-blue-50 border-blue-100">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              Balance
            </p>
            <p className="text-2xl font-bold text-blue-700 mt-1">R$ 0,00</p>
          </div>
        </div>
      </div>
    </div>
  );
}

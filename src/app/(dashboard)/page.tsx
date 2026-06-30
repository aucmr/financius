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

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Income", value: "R$ 0,00", color: "green" },
            { label: "Total Expenses", value: "R$ 0,00", color: "red" },
            { label: "Balance", value: "R$ 0,00", color: "blue" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className={`rounded-xl border p-5 bg-${color}-50 border-${color}-100`}
            >
              <p className={`text-xs font-medium text-${color}-600 uppercase tracking-wide`}>
                {label}
              </p>
              <p className={`text-2xl font-bold text-${color}-700 mt-1`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">💰 Financius</h1>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-3 text-sm">
            <a href="/" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </a>
            <a href="/expenses" className="text-gray-600 hover:text-gray-900">
              Expenses
            </a>
            <a href="/income" className="text-gray-600 hover:text-gray-900">
              Income
            </a>
          </nav>
          <span className="text-sm text-gray-600">
            Hello, <strong>{session.user?.name}</strong>
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

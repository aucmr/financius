import { getDashboardStats } from "@/src/app/(app)/dashboard/actions";

type DashboardShellProps = {
    userName: string | null;
};

export async function DashboardShell({ userName }: DashboardShellProps) {
    const stats = await getDashboardStats();

    return (
        <section className="space-y-6">
            <header>
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">
                    Dashboard
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
                    Application Overview
                </h1>
                <p className="mt-2 text-sm text-zinc-600">
                    Welcome back{userName ? `, ${userName}` : ""}.
                </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {stats.map((stat) => (
                    <article
                        key={stat.label}
                        className="rounded-2xl border border-zinc-200 p-5 shadow-sm"
                    >
                        <p className="text-sm text-zinc-600">{stat.label}</p>
                        <p className="mt-3 text-2xl font-semibold text-zinc-900">{stat.value}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}

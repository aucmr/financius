import Link from "next/link";

export default function PublicHomePage() {
    return (
        <main className="mx-auto flex min-h-[80vh] w-full max-w-4xl flex-col items-start justify-center gap-6 px-6 py-16">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">
                Base Full-Stack Starter
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-900">
                Feature-first Next.js foundation with PostgreSQL and authentication.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-zinc-600">
                The project is organized by route groups and feature domains so you can
                scale without large refactors.
            </p>

            <div className="flex flex-wrap items-center gap-3">
                <Link
                    href="/sign-in"
                    className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
                >
                    Sign In
                </Link>
                <Link
                    href="/sign-up"
                    className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
                >
                    Create Account
                </Link>
                <Link
                    href="/dashboard"
                    className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
                >
                    Open Dashboard
                </Link>
            </div>
        </main>
    );
}

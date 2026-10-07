import Link from "next/link";

import { buttonVariants } from "@/src/components/ui/button";

export default function PublicHomePage() {
    return (
        <main className="mx-auto flex min-h-[80vh] w-full max-w-4xl flex-col items-start justify-center gap-6 px-6 py-16">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Base Full-Stack Starter
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground">
                Feature-first Next.js foundation with PostgreSQL and authentication.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                The project is organized by route groups and feature domains so you can
                scale without large refactors.
            </p>

            <div className="flex flex-wrap items-center gap-3">
                <Link
                    href="/sign-in"
                    className={buttonVariants()}
                >
                    Sign In
                </Link>
                <Link
                    href="/sign-up"
                    className={buttonVariants({ variant: "secondary" })}
                >
                    Create Account
                </Link>
                <Link
                    href="/dashboard"
                    className={buttonVariants({ variant: "secondary" })}
                >
                    Open Dashboard
                </Link>
            </div>
        </main>
    );
}

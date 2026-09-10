import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/src/app/(app)/_components/app-shell";
import { auth } from "@/src/lib/auth/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
    const session = await auth();

    if (!session?.user) {
        redirect("/sign-in");
    }

    return (
        <AppShell
            user={{
                name: session?.user?.name ?? null,
                email: session?.user?.email ?? null,
            }}
        >
            {children}
        </AppShell>
    );
}

import { DashboardShell } from "@/src/app/(app)/dashboard/_components/dashboard-shell";
import { SignOutButton } from "@/src/app/(auth)/_components/sign-out-button";
import { auth } from "@/src/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await auth();

    return (
        <main className="mx-auto w-full max-w-5xl px-6 py-12">
            <div className="mb-6 flex justify-end">
                <SignOutButton />
            </div>
            <DashboardShell userName={session?.user?.name ?? null} />
        </main>
    );
}

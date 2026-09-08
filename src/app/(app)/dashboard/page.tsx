import { DashboardOverview } from "@/src/app/(app)/dashboard/_components/dashboard-overview";
import { auth } from "@/src/lib/auth/auth";

export default async function DashboardPage() {
    const session = await auth();

    return <DashboardOverview userName={session?.user?.name ?? null} />;
}

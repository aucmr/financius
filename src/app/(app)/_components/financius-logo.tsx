import Link from "next/link";

import { cn } from "@/src/lib/utils/cn";

type FinanciusLogoProps = {
    collapsed?: boolean;
};

export function FinanciusLogo({ collapsed = false }: FinanciusLogoProps) {
    return (
        <Link
            href="/dashboard"
            className={cn(
                "flex min-w-0 items-center gap-3 text-foreground",
                collapsed && "sm:justify-center",
            )}
            aria-label="Financius - Dashboard"
        >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground">
                F
            </span>
            <span
                className={cn(
                    "truncate text-base font-semibold tracking-tight",
                    collapsed && "sm:hidden",
                )}
            >
                Financius
            </span>
        </Link>
    );
}

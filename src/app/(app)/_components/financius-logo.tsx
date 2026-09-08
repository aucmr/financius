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
                "flex min-w-0 items-center gap-3 text-base-content",
                collapsed && "lg:justify-center",
            )}
            aria-label="Financius - Dashboard"
        >
            <span className="avatar avatar-placeholder shrink-0">
                <span className="size-9 rounded-field bg-primary text-base font-semibold text-primary-content shadow-sm">
                    F
                </span>
            </span>
            <span
                className={cn(
                    "truncate text-base font-semibold tracking-tight",
                    collapsed && "lg:hidden",
                )}
            >
                Financius
            </span>
        </Link>
    );
}

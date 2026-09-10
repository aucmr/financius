"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { cn } from "@/src/lib/utils/cn";

type SignOutButtonProps = {
    collapsed?: boolean;
};

export function SignOutButton({ collapsed = false }: SignOutButtonProps) {
    return (
        <Link
            href="/"
            className=" w-full rounded-field px-3 text-sm"
            onClick={(event) => {
                event.preventDefault();
                void signOut({ callbackUrl: "/" });
            }}
            aria-label="Sair"
            title={collapsed ? "Sair" : undefined}
        >
            <span className="icon-[tabler--logout-2] size-5" aria-hidden="true" />
            <span className={cn("min-w-0 truncate", collapsed && "sm:hidden")}>Sair</span>
        </Link>
    );
}

"use client";

import { signOut } from "next-auth/react";
import { cn } from "@/src/lib/utils/cn";

type SignOutButtonProps = {
    collapsed?: boolean;
};

export function SignOutButton({ collapsed = false }: SignOutButtonProps) {
    return (
        <button
            type="button"
            className={cn(
                "btn btn-ghost btn-sm mt-4",
                collapsed ? "btn-square lg:mx-auto" : "w-full justify-start",
            )}
            onClick={() => {
                void signOut({ callbackUrl: "/" });
            }}
            aria-label="Sair"
            title={collapsed ? "Sair" : undefined}
        >
            <span className="icon-[tabler--logout-2] size-5" aria-hidden="true" />
            <span className={cn(collapsed && "lg:sr-only")}>Sair</span>
        </button>
    );
}

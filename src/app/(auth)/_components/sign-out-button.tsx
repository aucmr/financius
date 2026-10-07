"use client";

import Link from "next/link";
import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";

import { buttonVariants } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils/cn";

type SignOutButtonProps = {
    collapsed?: boolean;
};

export function SignOutButton({ collapsed = false }: SignOutButtonProps) {
    return (
        <Link
            href="/"
            className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-10 w-full justify-start gap-3 px-3 text-sm",
            )}
            onClick={(event) => {
                event.preventDefault();
                void signOut({ callbackUrl: "/" });
            }}
            aria-label="Sair"
            title={collapsed ? "Sair" : undefined}
        >
            <LogOutIcon aria-hidden="true" />
            <span className={cn("min-w-0 truncate", collapsed && "sm:hidden")}>Sair</span>
        </Link>
    );
}

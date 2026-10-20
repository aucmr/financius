"use client";

import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";

import { DropdownMenuItem } from "@/src/components/ui/dropdown-menu";

export function SignOutButton() {
    return (
        <DropdownMenuItem onClick={() => void signOut({ callbackUrl: "/" })}>
            <LogOutIcon data-icon="inline-start" aria-hidden="true" />
            Sair
        </DropdownMenuItem>
    );
}

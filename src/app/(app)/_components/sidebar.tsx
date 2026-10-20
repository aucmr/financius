"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { ChevronDownIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { FinanciusLogo } from "@/src/app/(app)/_components/financius-logo";
import { SidebarNav } from "@/src/app/(app)/_components/sidebar-nav";
import { SignOutButton } from "@/src/app/(auth)/_components/sign-out-button";

import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Button } from "@/src/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Separator } from "@/src/components/ui/separator";
import { cn } from "@/src/lib/utils/cn";

export type SidebarUser = {
    name: string | null;
    email: string | null;
};

type SidebarProps = {
    collapsed: boolean;
    mobileOpen: boolean;
    user: SidebarUser;
    onNavigate: () => void;
};

function getUserInitial(user: SidebarUser) {
    return (user.name?.trim().charAt(0) || user.email?.trim().charAt(0) || "F").toUpperCase();
}

export function Sidebar({
    collapsed,
    mobileOpen,
    user,
    onNavigate,
}: SidebarProps) {
    const { theme, setTheme } = useTheme();
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);

    return (
        <aside
            id="financius-sidebar"
            className={cn(
                "fixed inset-y-0 start-0 z-50 flex w-72 max-w-[calc(100vw-2rem)] flex-col overflow-y-auto border-e bg-sidebar text-sidebar-foreground shadow-lg transition-transform duration-300 sm:static sm:z-auto sm:h-screen sm:max-w-none sm:translate-x-0 sm:shadow-none",
                collapsed ? "sm:w-20" : "sm:w-72",
                mobileOpen ? "translate-x-0" : "-translate-x-full",
            )}
            aria-label="Barra lateral"
        >
            <div
                className={cn(
                    "flex w-full items-center gap-3 px-5 py-4",
                    collapsed && "sm:justify-center sm:px-0",
                )}
            >
                <FinanciusLogo collapsed={collapsed} />
            </div>

            <div className="px-2 pt-4">
                <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
            </div>

            <div className={cn("mt-auto flex flex-col gap-3 p-4", collapsed && "sm:px-3")}>
                <Separator />
                <DropdownMenu onOpenChange={(open) => setAccountMenuOpen(open)}>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                type="button"
                                variant="ghost"
                                className={cn(
                                    "h-auto min-h-10 w-full justify-start gap-3 px-0 py-2 text-left",
                                    collapsed && "sm:justify-center sm:px-0",
                                )}
                                aria-label={`Abrir menu da conta de ${user.name || "Usuário"}`}
                                title={
                                    collapsed
                                        ? `Abrir menu da conta de ${user.name || "Usuário"} (${user.email || "Conta Financius"})`
                                        : undefined
                                }
                            />
                        }
                    >
                        <Avatar className="size-10">
                            <AvatarFallback className="text-sm font-semibold">
                                {getUserInitial(user)}
                            </AvatarFallback>
                        </Avatar>
                        <div className={cn("min-w-0 flex-1", collapsed && "sm:sr-only")}>
                            <p className="truncate text-sm font-semibold text-sidebar-foreground">
                                {user.name || "Usuário"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {user.email || "Conta Financius"}
                            </p>
                        </div>
                        <ChevronDownIcon
                            data-icon="inline-end"
                            aria-hidden="true"
                            className={cn(
                                "transition-transform",
                                accountMenuOpen && "rotate-180",
                                collapsed && "sm:hidden",
                            )}
                        />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="top"
                        sideOffset={8}
                        className="min-w-52"
                    >
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Tema</DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                                value={theme ?? "light"}
                                onValueChange={(value) => setTheme(value)}
                                aria-label="Tema"
                            >
                                <DropdownMenuRadioItem value="light">
                                    <SunIcon data-icon="inline-start" aria-hidden="true" />
                                    Claro
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="dark">
                                    <MoonIcon data-icon="inline-start" aria-hidden="true" />
                                    Escuro
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="system">
                                    <MonitorIcon data-icon="inline-start" aria-hidden="true" />
                                    Sistema
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <SignOutButton />
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}

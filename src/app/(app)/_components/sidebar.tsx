"use client";

import { FinanciusLogo } from "@/src/app/(app)/_components/financius-logo";
import { SidebarNav } from "@/src/app/(app)/_components/sidebar-nav";
import { SignOutButton } from "@/src/app/(auth)/_components/sign-out-button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils/cn";

export type SidebarUser = {
    name: string | null;
    email: string | null;
};

type SidebarProps = {
    collapsed: boolean;
    mobileOpen: boolean;
    user: SidebarUser;
    onToggleCollapsed: () => void;
    onNavigate: () => void;
};

function getUserInitial(user: SidebarUser) {
    return (user.name?.trim().charAt(0) || user.email?.trim().charAt(0) || "F").toUpperCase();
}

export function Sidebar({
    collapsed,
    mobileOpen,
    user,
    onToggleCollapsed,
    onNavigate,
}: SidebarProps) {
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
                    "flex w-full items-center justify-between gap-3 px-5 py-4",
                    collapsed && "sm:gap-1 sm:justify-center sm:px-0",
                )}
            >
                <FinanciusLogo collapsed={collapsed} />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hidden sm:inline-flex"
                    onClick={onToggleCollapsed}
                    aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
                    aria-expanded={!collapsed}
                    aria-controls="financius-sidebar"
                    title={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
                >
                    {collapsed ? (
                        <ChevronRightIcon aria-hidden="true" />
                    ) : (
                        <ChevronLeftIcon aria-hidden="true" />
                    )}
                </Button>
            </div>

            <div className="px-2 pt-4">
                <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
            </div>

            <div className={cn("flex flex-col gap-4 p-4", collapsed && "sm:px-3")}>
                <div className="border-t pt-4">
                    <ul className="flex w-full flex-col gap-1">
                        <li>
                            <SignOutButton collapsed={collapsed} />
                        </li>
                    </ul>
                </div>
                <div className={cn("flex items-center gap-3", collapsed && "sm:justify-center")}>
                    <Avatar className="size-10">
                        <AvatarFallback className="text-sm font-semibold">{getUserInitial(user)}</AvatarFallback>
                    </Avatar>
                    <div className={cn("min-w-0 flex-1", collapsed && "sm:hidden")}>
                        <p className="truncate text-sm font-semibold text-sidebar-foreground">
                            {user.name || "Usuário"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {user.email || "Conta Financius"}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

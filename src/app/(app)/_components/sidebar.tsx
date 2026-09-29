"use client";

import { FinanciusLogo } from "@/src/app/(app)/_components/financius-logo";
import { SidebarNav } from "@/src/app/(app)/_components/sidebar-nav";
import { SignOutButton } from "@/src/app/(auth)/_components/sign-out-button";
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
                "drawer drawer-start fixed inset-y-0 inset-s-0 z-50 flex w-72 max-w-[calc(100vw-2rem)] flex-col overflow-y-auto border-e border-base-content/20 bg-base-100 shadow-lg transition-transform duration-300 sm:static sm:z-auto sm:h-screen sm:max-w-none sm:translate-x-0 sm:shadow-none",
                collapsed ? "sm:w-20" : "sm:w-72",
                mobileOpen ? "translate-x-0" : "-translate-x-full",
            )}
            aria-label="Barra lateral"
        >
            <div
                className={cn(
                    "drawer-header flex w-full items-center justify-between gap-3 px-5 py-4",
                    collapsed && "sm:gap-1 sm:justify-center sm:px-0",
                )}
            >
                <FinanciusLogo collapsed={collapsed} />
                <button
                    type="button"
                    className="btn btn-circle btn-text btn-sm hidden sm:inline-flex"
                    onClick={onToggleCollapsed}
                    aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
                    aria-expanded={!collapsed}
                    aria-controls="financius-sidebar"
                    title={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
                >
                    <span
                        className={cn(
                            collapsed
                                ? "icon-[tabler--chevron-right]"
                                : "icon-[tabler--chevron-left]",
                            "size-5",
                        )}
                        aria-hidden="true"
                    />
                </button>
            </div>

            <div className="drawer-body px-2 pt-4">
                <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
            </div>

            <div className={cn("flex flex-col gap-4 p-4", collapsed && "sm:px-3")}>
                <div className="border-t border-base-content/15 pt-4">
                    <ul className="menu menu-sm w-full gap-1 p-0">
                        <li>
                            <SignOutButton collapsed={collapsed} />
                        </li>
                    </ul>
                </div>
                <div className={cn("flex items-center gap-3", collapsed && "sm:justify-center")}>
                    <div className="avatar avatar-placeholder shrink-0">
                        <div className="size-10 rounded-full bg-base-200 text-base-content">
                            <span className="text-sm font-semibold">{getUserInitial(user)}</span>
                        </div>
                    </div>
                    <div className={cn("min-w-0 flex-1", collapsed && "sm:hidden")}>
                        <p className="truncate text-sm font-semibold text-base-content">
                            {user.name || "Usuário"}
                        </p>
                        <p className="truncate text-xs text-base-content/60">
                            {user.email || "Conta Financius"}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

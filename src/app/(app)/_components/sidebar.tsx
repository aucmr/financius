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
                "drawer drawer-start fixed inset-y-0 start-0 z-50 flex w-72 max-w-[calc(100vw-2rem)] flex-col bg-base-100 shadow-lg transition-transform duration-300 lg:static lg:z-auto lg:h-screen lg:max-w-none lg:translate-x-0 lg:shadow-none",
                collapsed ? "lg:w-20" : "lg:w-72",
                mobileOpen ? "translate-x-0" : "-translate-x-full",
            )}
            aria-label="Barra lateral"
        >
            <div
                className={cn(
                    "drawer-header min-h-20 px-5 py-4",
                    collapsed && "lg:justify-center lg:px-3",
                )}
            >
                <FinanciusLogo collapsed={collapsed} />
                <button
                    type="button"
                    className="btn btn-ghost btn-square btn-sm hidden lg:inline-flex"
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

            <div className="drawer-body px-3 py-4">
                <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
            </div>

            <div className={cn("drawer-footer block p-4", collapsed && "lg:px-3")}>
                <div className={cn("flex items-center gap-3", collapsed && "lg:justify-center")}>
                    <div className="avatar avatar-placeholder shrink-0">
                        <div className="size-10 rounded-full bg-base-200 text-base-content">
                            <span className="text-sm font-semibold">{getUserInitial(user)}</span>
                        </div>
                    </div>
                    <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
                        <p className="truncate text-sm font-semibold text-base-content">
                            {user.name || "Usuário"}
                        </p>
                        <p className="truncate text-xs text-base-content/60">
                            {user.email || "Conta Financius"}
                        </p>
                    </div>
                </div>
                <SignOutButton collapsed={collapsed} />
            </div>
        </aside>
    );
}

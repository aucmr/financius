"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/src/lib/utils/cn";

export const appNavigation = [
    {
        href: "/dashboard",
        label: "Dashboard",
        description: "Visão geral das finanças",
        icon: "icon-[tabler--layout-dashboard]",
    },
    {
        href: "/receitas",
        label: "Receitas",
        description: "Acompanhe as entradas",
        icon: "icon-[tabler--wallet]",
    },
    {
        href: "/despesas",
        label: "Despesas",
        description: "Acompanhe as saídas",
        icon: "icon-[tabler--receipt-2]",
    },
] as const;

type SidebarNavProps = {
    collapsed: boolean;
    onNavigate?: () => void;
};

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
    const pathname = usePathname();

    return (
        <nav aria-label="Navegação principal">
            <p className={cn("mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-base-content/40", collapsed && "lg:sr-only")}>
                Principal
            </p>
            <ul className="menu menu-sm w-full gap-1 p-0">
                {appNavigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={cn(
                                    "min-h-10 w-full rounded-field px-3 text-sm",
                                    isActive && "menu-active",
                                    collapsed && "lg:justify-center lg:px-0",
                                )}
                                aria-current={isActive ? "page" : undefined}
                                title={collapsed ? item.label : undefined}
                                onClick={onNavigate}
                            >
                                <span className={cn(item.icon, "size-5 shrink-0")} aria-hidden="true" />
                                <span className={cn("min-w-0 truncate", collapsed && "lg:hidden")}>
                                    {item.label}
                                </span>
                                <span className="sr-only">{item.description}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

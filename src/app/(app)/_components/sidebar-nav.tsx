"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LayoutDashboardIcon, ListChecksIcon, ReceiptTextIcon, ShapesIcon, WalletIcon, type LucideIcon } from "lucide-react";

import { buttonVariants } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils/cn";

export const appNavigation = [
    {
        href: "/dashboard",
        label: "Dashboard",
        description: "Visão geral das finanças",
        icon: LayoutDashboardIcon,
    },
    {
        href: "/receitas",
        label: "Receitas",
        description: "Acompanhe as entradas",
        icon: WalletIcon,
    },
    {
        href: "/despesas",
        label: "Despesas",
        description: "Acompanhe as saídas",
        icon: ReceiptTextIcon,
    },
    {
        href: "/categorias",
        label: "Categorias",
        description: "Gerencie categorias e subcategorias",
        icon: ShapesIcon,
    },
    {
        href: "/contas-a-pagar",
        label: "Contas a pagar",
        description: "Checklist mensal de pagamentos",
        icon: ListChecksIcon,
    },
] satisfies ReadonlyArray<{ href: string; label: string; description: string; icon: LucideIcon }>;

type SidebarNavProps = {
    collapsed: boolean;
    onNavigate?: () => void;
};

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
    const pathname = usePathname();

    return (
        <nav aria-label="Navegação principal">
            <p className={cn("mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground", collapsed && "sm:sr-only")}>
                Principal
            </p>
            <ul className="flex w-full flex-col gap-1">
                {appNavigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={cn(
                                    buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                                    "h-10 w-full justify-start gap-3 px-3 text-sm",
                                    collapsed && "sm:justify-center sm:px-0",
                                )}
                                aria-current={isActive ? "page" : undefined}
                                title={collapsed ? item.label : undefined}
                                onClick={onNavigate}
                            >
                                <item.icon aria-hidden="true" />
                                <span className={cn("min-w-0 truncate", collapsed && "sm:hidden")}>
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

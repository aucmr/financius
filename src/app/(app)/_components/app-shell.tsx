"use client";

import { Fragment, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";

import { Sidebar, type SidebarUser } from "@/src/app/(app)/_components/sidebar";
import { appNavigation } from "@/src/app/(app)/_components/sidebar-nav";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/src/components/ui/breadcrumb";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils/cn";

const SIDEBAR_STORAGE_KEY = "financius:sidebar-collapsed";
const sidebarPreferenceListeners = new Set<() => void>();

function subscribeToSidebarPreference(listener: () => void) {
    sidebarPreferenceListeners.add(listener);
    window.addEventListener("storage", listener);

    return () => {
        sidebarPreferenceListeners.delete(listener);
        window.removeEventListener("storage", listener);
    };
}

function getSidebarPreference() {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

function getServerSidebarPreference() {
    return false;
}

type AppShellProps = {
    children: ReactNode;
    user: SidebarUser;
};

type AppBreadcrumb = {
    label: string;
    href?: string;
};

function getBreadcrumbs(pathname: string): AppBreadcrumb[] {
    const section = appNavigation.find(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );

    if (!section) {
        return [{ label: "Dashboard" }];
    }

    if (pathname === section.href) {
        return [{ label: section.label }];
    }

    let nestedLabel: string | undefined;

    if (section.href === "/despesas") {
        if (pathname.startsWith("/despesas/nova")) {
            nestedLabel = "Nova despesa";
        } else if (pathname.startsWith("/despesas/importar")) {
            nestedLabel = "Importar arquivo";
        } else if (pathname.endsWith("/editar")) {
            nestedLabel = "Editar despesa";
        }
    } else if (
        section.href === "/contas-a-pagar" &&
        pathname.startsWith("/contas-a-pagar/gerenciar")
    ) {
        nestedLabel = "Gerenciar contas a pagar";
    }

    if (!nestedLabel) {
        return [{ label: section.label }];
    }

    return [
        { label: section.label, href: section.href },
        { label: nestedLabel },
    ];
}

export function AppShell({ children, user }: AppShellProps) {
    const pathname = usePathname();
    const collapsed = useSyncExternalStore(
        subscribeToSidebarPreference,
        getSidebarPreference,
        getServerSidebarPreference,
    );
    const [mobileOpen, setMobileOpen] = useState(false);
    const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!mobileOpen) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setMobileOpen(false);
                mobileMenuButtonRef.current?.focus();
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [mobileOpen]);

    function toggleCollapsed() {
        const next = !collapsed;
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
        sidebarPreferenceListeners.forEach((listener) => listener());
    }

    function closeMobileMenu() {
        setMobileOpen(false);
        mobileMenuButtonRef.current?.focus();
    }

    return (
        <div className="h-screen overflow-hidden bg-muted sm:flex">
            <button
                type="button"
                className={cn(
                    "fixed inset-0 z-40 bg-foreground/40 transition-opacity duration-300 sm:hidden",
                    mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
                )}
                onClick={closeMobileMenu}
                aria-label="Fechar menu"
                tabIndex={mobileOpen ? 0 : -1}
            />

            <Sidebar
                collapsed={collapsed}
                mobileOpen={mobileOpen}
                user={user}
                onNavigate={closeMobileMenu}
            />

            <div className="flex h-screen min-h-0 min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b bg-background px-4 sm:px-6 lg:px-8">
                    <Button
            ref={mobileMenuButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            aria-controls="financius-sidebar"
            aria-expanded={mobileOpen}
                    >
            <MenuIcon aria-hidden="true" />
                    </Button>
                    <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
            aria-expanded={!collapsed}
            aria-controls="financius-sidebar"
            title={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
                    >
            {collapsed ? (
                <PanelLeftOpenIcon aria-hidden="true" />
            ) : (
                <PanelLeftCloseIcon aria-hidden="true" />
            )}
                    </Button>
                    <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
            <BreadcrumbList className="flex-nowrap overflow-hidden">
                {getBreadcrumbs(pathname).map((item, index) => (
                    <Fragment key={`${item.label}-${index}`}>
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem className="min-w-0">
                            {item.href ? (
                                <BreadcrumbLink
                                    className="max-w-36 truncate"
                                    render={<Link href={item.href}>{item.label}</Link>}
                                />
                            ) : (
                                <BreadcrumbPage className="max-w-[50vw] truncate sm:max-w-sm">
                                    {item.label}
                                </BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                    </Fragment>
                ))}
            </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <main id="main-content" className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

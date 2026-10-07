"use client";

import { useEffect, useRef, useSyncExternalStore, useState, type ReactNode } from "react";

import { MenuIcon, SearchIcon } from "lucide-react";

import { FinanciusLogo } from "@/src/app/(app)/_components/financius-logo";
import { Sidebar, type SidebarUser } from "@/src/app/(app)/_components/sidebar";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Button } from "@/src/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/src/components/ui/input-group";
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

export function AppShell({ children, user }: AppShellProps) {
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
                onToggleCollapsed={toggleCollapsed}
                onNavigate={closeMobileMenu}
            />

            <div className="flex h-screen min-h-0 min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b bg-background px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-1 items-center gap-3">
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
                        <div className="hidden min-w-0 sm:block">
                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                Financius
                            </p>
                            <p className="truncate text-sm font-semibold text-foreground">
                                Visão geral
                            </p>
                        </div>
                        <InputGroup className="hidden max-w-sm flex-1 md:flex">
                            <InputGroupAddon>
                                <SearchIcon aria-hidden="true" />
                            </InputGroupAddon>
                            <InputGroupInput
                                type="search"
                                placeholder="Buscar"
                                aria-label="Buscar no Financius"
                            />
                        </InputGroup>
                    </div>
                    <div>
                        <div className="sm:hidden">
                            <FinanciusLogo />
                        </div>
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="max-w-36 truncate text-sm font-semibold text-foreground">
                                {user.name || "Usuário"}
                            </p>
                            <p className="text-xs text-muted-foreground">Conta do casal</p>
                        </div>
                        <Avatar>
                            <AvatarFallback className="text-sm font-semibold">
                                {(user.name?.trim().charAt(0) || user.email?.trim().charAt(0) || "F").toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                <main id="main-content" className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

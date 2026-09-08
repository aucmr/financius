"use client";

import { useEffect, useRef, useSyncExternalStore, useState, type ReactNode } from "react";

import { FinanciusLogo } from "@/src/app/(app)/_components/financius-logo";
import { Sidebar, type SidebarUser } from "@/src/app/(app)/_components/sidebar";
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
        <div className="min-h-screen bg-base-200 lg:flex">
            <button
                type="button"
                className={cn(
                    "fixed inset-0 z-40 bg-neutral/40 transition-opacity duration-300 lg:hidden",
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

            <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                <header className="navbar sticky top-0 z-30 min-h-16 bg-base-100 px-4 shadow-sm sm:px-6 lg:px-8">
                    <div className="navbar-start w-auto flex-1 gap-3">
                        <button
                            ref={mobileMenuButtonRef}
                            type="button"
                            className="btn btn-soft btn-square btn-sm lg:hidden"
                            onClick={() => setMobileOpen(true)}
                            aria-label="Abrir menu"
                            aria-controls="financius-sidebar"
                            aria-expanded={mobileOpen}
                        >
                            <span className="icon-[tabler--menu-2] size-5" aria-hidden="true" />
                        </button>
                        <div className="hidden min-w-0 md:block">
                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-base-content/50">
                                Financius
                            </p>
                            <p className="truncate text-sm font-semibold text-base-content">
                                Visão geral
                            </p>
                        </div>
                        <label className="input input-sm hidden max-w-sm flex-1 items-center gap-2 md:flex">
                            <span className="icon-[tabler--search] size-4 text-base-content/50" aria-hidden="true" />
                            <input
                                type="search"
                                className="grow"
                                placeholder="Buscar"
                                aria-label="Buscar no Financius"
                            />
                        </label>
                    </div>
                    <div className="navbar-center">
                        <div className="lg:hidden">
                            <FinanciusLogo />
                        </div>
                    </div>
                    <div className="navbar-end w-auto flex-1 gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="max-w-36 truncate text-sm font-semibold text-base-content">
                                {user.name || "Usuário"}
                            </p>
                            <p className="text-xs text-base-content/50">Conta do casal</p>
                        </div>
                        <div className="avatar avatar-placeholder shrink-0">
                            <div className="size-9 rounded-full bg-primary/10 text-primary">
                                <span className="text-sm font-semibold">
                                    {(user.name?.trim().charAt(0) || user.email?.trim().charAt(0) || "F").toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

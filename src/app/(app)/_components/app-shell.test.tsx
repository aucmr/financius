// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/src/app/(app)/_components/app-shell";

const usePathnameMock = vi.hoisted(() => vi.fn());

type MockSidebarProps = {
    collapsed: boolean;
    mobileOpen: boolean;
    onNavigate: () => void;
};

vi.mock("next/navigation", () => ({
    usePathname: usePathnameMock,
}));

vi.mock("next/link", () => ({
    default: ({
        children,
        ...props
    }: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>) => (
        <a {...props}>{children}</a>
    ),
}));

vi.mock("@/src/app/(app)/_components/financius-logo", () => ({
    FinanciusLogo: () => <span>Financius</span>,
}));

vi.mock("@/src/app/(app)/_components/sidebar", () => ({
    Sidebar: ({ collapsed, mobileOpen, onNavigate }: MockSidebarProps) => (
        <aside
            id="financius-sidebar"
            aria-label="Barra lateral"
            data-collapsed={String(collapsed)}
            data-mobile-open={String(mobileOpen)}
        >
            <button type="button" onClick={onNavigate}>
                Navegar para fechar
            </button>
        </aside>
    ),
}));

afterEach(() => {
    cleanup();
});

beforeEach(() => {
    window.localStorage.clear();
    usePathnameMock.mockReturnValue("/dashboard");
});

describe("AppShell", () => {
    it("keeps the main area in its own viewport scroll container", () => {
        render(
            <AppShell user={{ name: "Ana", email: "ana@example.com" }}>
                <p>Conteúdo</p>
            </AppShell>,
        );

        const main = screen.getByRole("main");
        const contentColumn = main.parentElement;
        const shell = contentColumn?.parentElement;

        expect(shell).toHaveClass("h-screen", "overflow-hidden");
        expect(contentColumn).toHaveClass("h-screen", "min-h-0");
        expect(main).toHaveClass("min-h-0", "overflow-y-auto");
    });

    it("opens the mobile menu and restores focus after Escape", () => {
        render(
            <AppShell user={{ name: "Ana", email: "ana@example.com" }}>
                <p>Conteúdo</p>
            </AppShell>,
        );

        const trigger = screen.getByRole("button", { name: "Abrir menu" });
        const sidebar = screen.getByRole("complementary", { name: "Barra lateral" });

        expect(trigger).toHaveAttribute("aria-expanded", "false");
        expect(sidebar).toHaveAttribute("data-mobile-open", "false");

        fireEvent.click(trigger);

        expect(trigger).toHaveAttribute("aria-expanded", "true");
        expect(sidebar).toHaveAttribute("data-mobile-open", "true");
        expect(screen.getByRole("button", { name: "Fechar menu" })).toHaveAttribute(
            "tabindex",
            "0",
        );

        fireEvent.keyDown(window, { key: "Escape" });

        expect(sidebar).toHaveAttribute("data-mobile-open", "false");
        expect(trigger).toHaveFocus();
    });

    it("closes the mobile menu through the backdrop and navigation", () => {
        render(
            <AppShell user={{ name: "Ana", email: "ana@example.com" }}>
                <p>Conteúdo</p>
            </AppShell>,
        );

        const trigger = screen.getByRole("button", { name: "Abrir menu" });
        const sidebar = screen.getByRole("complementary", { name: "Barra lateral" });

        fireEvent.click(trigger);
        fireEvent.click(screen.getByRole("button", { name: "Fechar menu" }));

        expect(sidebar).toHaveAttribute("data-mobile-open", "false");
        expect(trigger).toHaveFocus();

        fireEvent.click(trigger);
        fireEvent.click(screen.getByRole("button", { name: "Navegar para fechar" }));

        expect(sidebar).toHaveAttribute("data-mobile-open", "false");
        expect(trigger).toHaveFocus();
    });

    it("replaces the search and account header with a route-aware breadcrumb", () => {
        usePathnameMock.mockReturnValue("/despesas/nova");

        render(
            <AppShell user={{ name: "Ana", email: "ana@example.com" }}>
                <p>Conteúdo</p>
            </AppShell>,
        );

        expect(screen.getByRole("navigation", { name: "breadcrumb" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Despesas" })).toHaveAttribute(
            "href",
            "/despesas",
        );
        expect(screen.getByText("Nova despesa")).toHaveAttribute("aria-current", "page");
        expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
        expect(screen.queryByText("ana@example.com")).not.toBeInTheDocument();
    });

    it("persists the mini-sidebar preference from the header toggle", () => {
        render(
            <AppShell user={{ name: "Ana", email: "ana@example.com" }}>
                <p>Conteúdo</p>
            </AppShell>,
        );

        const sidebar = screen.getByRole("complementary", { name: "Barra lateral" });

        expect(sidebar).toHaveAttribute("data-collapsed", "false");

        fireEvent.click(
            screen.getByRole("button", { name: "Recolher barra lateral" }),
        );

        expect(sidebar).toHaveAttribute("data-collapsed", "true");
        expect(window.localStorage.getItem("financius:sidebar-collapsed")).toBe("true");
    });
});

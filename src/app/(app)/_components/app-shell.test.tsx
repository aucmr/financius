// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/src/app/(app)/_components/app-shell";

type MockSidebarProps = {
    collapsed: boolean;
    mobileOpen: boolean;
    onToggleCollapsed: () => void;
    onNavigate: () => void;
};

vi.mock("@/src/app/(app)/_components/financius-logo", () => ({
    FinanciusLogo: () => <span>Financius</span>,
}));

vi.mock("@/src/app/(app)/_components/sidebar", () => ({
    Sidebar: ({ collapsed, mobileOpen, onToggleCollapsed, onNavigate }: MockSidebarProps) => (
        <aside
            id="financius-sidebar"
            aria-label="Barra lateral"
            data-collapsed={String(collapsed)}
            data-mobile-open={String(mobileOpen)}
        >
            <button type="button" onClick={onToggleCollapsed}>
                Alternar mini
            </button>
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

    it("persists the mini-sidebar preference", () => {
        render(
            <AppShell user={{ name: "Ana", email: "ana@example.com" }}>
                <p>Conteúdo</p>
            </AppShell>,
        );

        const sidebar = screen.getByRole("complementary", { name: "Barra lateral" });

        expect(sidebar).toHaveAttribute("data-collapsed", "false");

        fireEvent.click(screen.getByRole("button", { name: "Alternar mini" }));

        expect(sidebar).toHaveAttribute("data-collapsed", "true");
        expect(window.localStorage.getItem("financius:sidebar-collapsed")).toBe("true");
    });
});

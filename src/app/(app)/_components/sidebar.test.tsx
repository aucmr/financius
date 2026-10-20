// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { AnchorHTMLAttributes, PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Sidebar } from "@/src/app/(app)/_components/sidebar";
import { SidebarNav } from "@/src/app/(app)/_components/sidebar-nav";

const usePathnameMock = vi.hoisted(() => vi.fn());
const setThemeMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
    usePathname: usePathnameMock,
}));

vi.mock("next-themes", () => ({
    useTheme: () => ({ theme: "light", setTheme: setThemeMock }),
}));

vi.mock("next-auth/react", () => ({
    signOut: signOutMock,
}));

vi.mock("next/link", () => ({
    default: ({
        children,
        ...props
    }: PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement>>) => (
        <a {...props}>{children}</a>
    ),
}));

afterEach(() => {
    cleanup();
    setThemeMock.mockReset();
    signOutMock.mockReset();
});

describe("SidebarNav", () => {
    beforeEach(() => {
        usePathnameMock.mockReturnValue("/dashboard");
    });

    it("marks the current section and renders every primary route", () => {
        usePathnameMock.mockReturnValue("/despesas");

        render(<SidebarNav collapsed={false} />);

        expect(screen.getAllByRole("link")).toHaveLength(5);
        expect(
            screen.getByRole("link", { name: /categorias/i }),
        ).toHaveAttribute("href", "/categorias");
        expect(
            screen.getByRole("link", { name: /contas a pagar/i }),
        ).toHaveAttribute("href", "/contas-a-pagar");
        expect(screen.getByRole("link", { name: /despesas/i })).toHaveAttribute(
            "aria-current",
            "page",
        );
        expect(screen.getByRole("link", { name: /dashboard/i })).not.toHaveAttribute(
            "aria-current",
        );
    });

    it("keeps labels available and adds titles when collapsed", () => {
        render(<SidebarNav collapsed />);

        const dashboardLink = screen.getByRole("link", { name: /dashboard/i });

        expect(dashboardLink).toHaveAttribute("title", "Dashboard");
        expect(screen.getByText("Dashboard")).toHaveClass("sm:hidden");
    });
});

describe("Sidebar", () => {
    it("keeps collapsing controls in the application header", () => {
        render(
            <Sidebar
                collapsed={false}
                mobileOpen={false}
                user={{ name: "Ana", email: "ana@example.com" }}
                onNavigate={vi.fn()}
            />,
        );

        expect(
            screen.queryByRole("button", { name: /barra lateral/i }),
        ).not.toBeInTheDocument();
    });

    it("anchors the account menu at the bottom when collapsed", () => {
        render(
            <Sidebar
                collapsed
                mobileOpen={false}
                user={{ name: "Ana", email: "ana@example.com" }}
                onNavigate={vi.fn()}
            />,
        );

        const userEmail = screen.getByText("ana@example.com");
        const accountTrigger = screen.getByRole("button", {
            name: "Abrir menu da conta de Ana",
        });
        const footer = accountTrigger.closest(".mt-auto");

        expect(footer).toHaveClass("mt-auto");
        expect(accountTrigger).toHaveAttribute(
            "title",
            "Abrir menu da conta de Ana (ana@example.com)",
        );
        expect(accountTrigger).toHaveClass("sm:justify-center", "sm:px-0");
        expect(accountTrigger.querySelector('[data-icon="inline-end"]')).toHaveClass("sm:hidden");
        expect(userEmail.parentElement).toHaveClass("sm:sr-only");
        expect(footer?.querySelector('[data-slot="separator"]')).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "Sair" })).not.toBeInTheDocument();
    });

    it("opens the account menu and applies the selected theme", async () => {
        render(
            <Sidebar
                collapsed={false}
                mobileOpen={false}
                user={{ name: "Ana", email: "ana@example.com" }}
                onNavigate={vi.fn()}
            />,
        );

        const accountTrigger = screen.getByRole("button", {
            name: "Abrir menu da conta de Ana",
        });
        const disclosureIcon = accountTrigger.querySelector('[data-icon="inline-end"]');

        expect(disclosureIcon).toHaveClass("transition-transform");
        expect(disclosureIcon).not.toHaveClass("rotate-180");

        fireEvent.click(accountTrigger);
        const menu = await screen.findByRole("menu");
        expect(disclosureIcon).toHaveClass("rotate-180");
        expect(accountTrigger).toHaveAttribute("aria-expanded", "true");
        const darkThemeItem = within(menu).getByRole("menuitemradio", { name: "Escuro" });

        expect(within(menu).getByRole("menuitemradio", { name: "Claro" })).toBeInTheDocument();
        expect(within(menu).getByRole("menuitemradio", { name: "Sistema" })).toBeInTheDocument();
        expect(within(menu).getByRole("menuitem", { name: "Sair" })).toBeInTheDocument();

        fireEvent.click(darkThemeItem);

        expect(setThemeMock).toHaveBeenCalledWith("dark");
        expect(disclosureIcon).toHaveClass("rotate-180");

        fireEvent.click(accountTrigger);
        await waitFor(() => {
            expect(disclosureIcon).not.toHaveClass("rotate-180");
            expect(accountTrigger).toHaveAttribute("aria-expanded", "false");
        });
    });

    it("keeps the sidebar independently scrollable", () => {
        render(
            <Sidebar
                collapsed={false}
                mobileOpen={false}
                user={{ name: "Ana", email: "ana@example.com" }}
                onNavigate={vi.fn()}
            />,
        );

        expect(screen.getByRole("complementary", { name: "Barra lateral" })).toHaveClass(
            "overflow-y-auto",
            "sm:h-screen",
        );
    });
});

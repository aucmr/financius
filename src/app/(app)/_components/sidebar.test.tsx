// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Sidebar } from "@/src/app/(app)/_components/sidebar";
import { SidebarNav } from "@/src/app/(app)/_components/sidebar-nav";

const usePathnameMock = vi.hoisted(() => vi.fn());

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

afterEach(() => {
    cleanup();
});

describe("SidebarNav", () => {
    beforeEach(() => {
        usePathnameMock.mockReturnValue("/dashboard");
    });

    it("marks the current section and renders every primary route", () => {
        usePathnameMock.mockReturnValue("/despesas");

        render(<SidebarNav collapsed={false} />);

        expect(screen.getAllByRole("link")).toHaveLength(3);
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
        expect(screen.getByText("Dashboard")).toHaveClass("lg:hidden");
    });
});

describe("Sidebar", () => {
    it("delegates the collapse action to its parent", () => {
        const onToggleCollapsed = vi.fn();

        render(
            <Sidebar
                collapsed={false}
                mobileOpen={false}
                user={{ name: "Ana", email: "ana@example.com" }}
                onToggleCollapsed={onToggleCollapsed}
                onNavigate={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Recolher barra lateral" }));

        expect(onToggleCollapsed).toHaveBeenCalledOnce();
    });
});

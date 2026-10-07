// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SignOutButton } from "@/src/app/(auth)/_components/sign-out-button";

const signOutMock = vi.hoisted(() => vi.fn());

vi.mock("next-auth/react", () => ({
    signOut: signOutMock,
}));

afterEach(() => {
    cleanup();
    signOutMock.mockReset();
});

describe("SignOutButton", () => {
    it("uses the same menu link presentation and keeps the action labeled", () => {
        render(<SignOutButton />);

        const link = screen.getByRole("link", { name: "Sair" });

        expect(link).toHaveAttribute("href", "/");
        expect(link).toHaveClass("h-10", "w-full", "px-3", "text-sm");
        expect(screen.getByText("Sair")).toBeVisible();

        fireEvent.click(link);

        expect(signOutMock).toHaveBeenCalledOnce();
        expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/" });
    });

    it("uses the collapsed menu presentation on desktop", () => {
        render(<SignOutButton collapsed />);

        const link = screen.getByRole("link", { name: "Sair" });

        expect(link).toHaveAttribute("title", "Sair");
        expect(link).toHaveClass("w-full", "px-3");
        expect(link).not.toHaveClass("sm:justify-center", "sm:px-0");
        expect(screen.getByText("Sair")).toHaveClass("sm:hidden");
    });
});

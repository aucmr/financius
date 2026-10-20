// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SignOutButton } from "@/src/app/(auth)/_components/sign-out-button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

const signOutMock = vi.hoisted(() => vi.fn());

vi.mock("next-auth/react", () => ({
    signOut: signOutMock,
}));

afterEach(() => {
    cleanup();
    signOutMock.mockReset();
});

describe("SignOutButton", () => {
    it("signs out from its account-menu item", () => {
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Conta</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <SignOutButton />
                </DropdownMenuContent>
            </DropdownMenu>,
        );

        fireEvent.click(screen.getByRole("button", { name: "Conta" }));

        const signOutItem = screen.getByRole("menuitem", { name: "Sair" });

        expect(signOutItem).toBeInTheDocument();
        fireEvent.click(signOutItem);

        expect(signOutMock).toHaveBeenCalledOnce();
        expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/" });
    });
});

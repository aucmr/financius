import { test, expect } from "@playwright/test";

const HUSBAND = {
  email: "husband@financius.app",
  password: "password123",
  name: "Husband",
};
const WIFE = {
  email: "wife@financius.app",
  password: "password123",
  name: "Wife",
};

test.describe("Authentication flow", () => {
  test("unauthenticated visit to / redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page is accessible at /login", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /financius/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("Husband can log in and sees dashboard with their name", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(HUSBAND.email);
    await page.getByLabel("Password").fill(HUSBAND.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByText(`Welcome back, ${HUSBAND.name}`)).toBeVisible();
  });

  test("Wife can log in and sees dashboard with their name", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(WIFE.email);
    await page.getByLabel("Password").fill(WIFE.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByText(`Welcome back, ${WIFE.name}`)).toBeVisible();
  });

  test("signed-in user visiting /login is redirected to /", async ({
    page,
  }) => {
    // Log in first
    await page.goto("/login");
    await page.getByLabel("Email").fill(HUSBAND.email);
    await page.getByLabel("Password").fill(HUSBAND.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");

    // Now navigate to /login — should bounce back to /
    await page.goto("/login");
    await expect(page).toHaveURL("/");
  });

  test("sign out returns user to /login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(HUSBAND.email);
    await page.getByLabel("Password").fill(HUSBAND.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");

    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

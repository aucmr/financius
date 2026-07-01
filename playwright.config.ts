import { defineConfig, devices } from "@playwright/test";

const PLAYWRIGHT_PORT = process.env.PLAYWRIGHT_PORT ?? "3000";
const APP_URL = `http://localhost:${PLAYWRIGHT_PORT}`;

const DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? APP_URL;

if (!DATABASE_URL) {
  throw new Error(
    "Missing required env var: TEST_DATABASE_URL or DATABASE_URL",
  );
}

if (!NEXTAUTH_SECRET) {
  throw new Error("Missing required env var: NEXTAUTH_SECRET");
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: APP_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PLAYWRIGHT_PORT}`,
    url: APP_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL,
      NEXTAUTH_SECRET,
      NEXTAUTH_URL,
    },
  },
});

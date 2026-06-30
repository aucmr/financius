import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"],
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
    },
  },
});

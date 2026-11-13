import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// The journey spec talks to the local Supabase stack with the keys that
// `pnpm env:local` writes. Real env vars win over the file.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const port = Number(process.env.E2E_PORT ?? 3000);
// localhost, not 127.0.0.1, so cookies match NEXT_PUBLIC_SITE_URL.
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
  webServer: {
    // CI tests the production build; locally reuse the running dev server.
    command: process.env.CI
      ? `pnpm build && pnpm start --port ${port}`
      : `pnpm dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});

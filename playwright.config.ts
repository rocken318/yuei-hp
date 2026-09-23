import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // In CI, also emit the HTML report so it can be uploaded as an artifact
  // when the job fails (see .github/workflows/ci.yml).
  reporter: process.env.CI ? [["dot"], ["html", { open: "never" }]] : "html",
  use: { baseURL: "http://localhost:3100" },
  webServer: {
    command: "pnpm build && pnpm start -p 3100",
    port: 3100,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 14"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-reduced",
      testMatch: /(?:home|pages)\.spec\.ts/,
      use: { ...devices["iPhone 14"], reducedMotion: "reduce" },
    },
  ],
});

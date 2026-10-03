import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "fs";

// Chromium resolution strategy:
// 1. CHROMIUM_PATH env var — explicit path (CI or manual override)
// 2. /opt/pw-browsers/chromium — pre-installed full Chromium (symlink to rev 1194 chrome-linux/chrome)
// 3. Playwright's own downloaded Chromium (CI after npx playwright install)
const localChromium = "/opt/pw-browsers/chromium";
const chromiumPath: string | undefined =
  process.env["CHROMIUM_PATH"] ??
  (existsSync(localChromium) ? localChromium : undefined);

// Use launchOptions.executablePath so the pre-installed binary works with Playwright 1.61+.
// In CI, chromiumPath is undefined and Playwright uses its own downloaded browser.
const chromiumOverride = chromiumPath
  ? {
      launchOptions: {
        executablePath: chromiumPath,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      },
    }
  : {};

const isCI = !!process.env["CI"];

export default defineConfig({
  testDir: "../../tests/e2e",
  outputDir: "../../test-results",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  globalTimeout: isCI ? 30 * 60 * 1000 : 8 * 60 * 1000,
  maxFailures: isCI ? 20 : 1,
  workers: isCI ? 2 : 1,
  retries: 0,
  reporter: [["html", { outputFolder: "../../playwright-report" }], ["line"]],
  use: {
    // 127.0.0.1, not localhost: some Windows runners refuse IPv6 loopback (::1)
    // connections (EACCES) while vite binds localhost to ::1.
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    // ── Chromium desktop viewports ────────────────────────────────
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...chromiumOverride },
    },
    {
      name: "desktop-1280",
      use: { ...devices["Desktop Chrome"], ...chromiumOverride, viewport: { width: 1280, height: 800 } },
    },
    {
      name: "desktop-1024",
      use: { ...devices["Desktop Chrome"], ...chromiumOverride, viewport: { width: 1024, height: 768 } },
    },
    // ── Firefox desktop ────────────────────────────────────────────
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    // ── WebKit desktop ─────────────────────────────────────────────
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // ── Chromium mobile viewports ──────────────────────────────────
    {
      name: "mobile-portrait",
      use: { ...devices["Pixel 5"], ...chromiumOverride },
    },
    {
      name: "mobile-landscape",
      use: { ...devices["Pixel 5 landscape"], ...chromiumOverride },
    },
    {
      name: "mobile-small",
      use: { ...devices["Desktop Chrome"], ...chromiumOverride, viewport: { width: 375, height: 667 } },
    },
    // ── Tablet viewport (Chromium) ─────────────────────────────────
    {
      name: "tablet-portrait",
      use: { ...devices["Desktop Chrome"], ...chromiumOverride, viewport: { width: 768, height: 1024 } },
    },
    // ── WebKit mobile / Safari-like ────────────────────────────────
    {
      name: "webkit-mobile",
      use: { ...devices["iPhone 14"] },
    },
  ],
  webServer: {
    // Run from apps/workbench — vite preview serves outDir (../../next) at base /next/
    command: "npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    // Wait for the v08 app to respond before running tests
    url: "http://127.0.0.1:4173/next/",
    timeout: 60_000,
    reuseExistingServer: false,
  },
});

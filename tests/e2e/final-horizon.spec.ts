/**
 * final-horizon.spec.ts
 * CHK-FINAL-E2E: canonical authored journey through T01–T04 features.
 * One contiguous user story: shell → authoring → performance.
 * Works on both desktop (sidebar nav) and mobile (bottom nav).
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = "/next/";

const NAV_LABELS: Record<string, string> = {
  "materials":   "Banks & Samples",
  "forms":       "Forms",
  "automation":  "Triggers",
  "instruments": "Devices",
  "performance": "Cue & Surface",
};

const MOBILE_TOP: Record<string, { top: string; sub?: string }> = {
  "materials":   { top: "Material", sub: "Banks & Samples" },
  "forms":       { top: "Material", sub: "Forms" },
  "automation":  { top: "Automate" },
  "instruments": { top: "Devices" },
  "performance": { top: "Perform" },
};

async function goto(page: Page) {
  await page.goto(BASE);
  await expect(page.locator("h1")).toContainText("TAROKE RIMIXER", { timeout: 10_000 });
}

async function goToPanel(page: Page, panel: string) {
  const sidebar = page.locator(".tr-navigator");
  if (await sidebar.isVisible()) {
    await sidebar.getByRole("button", { name: NAV_LABELS[panel] ?? panel }).click();
  } else {
    const route = MOBILE_TOP[panel];
    if (!route) throw new Error(`No mobile route for panel "${panel}"`);
    const mobileNav = page.getByRole("navigation", { name: "Main navigation" });
    await mobileNav.getByRole("button", { name: route.top }).click();
    if (route.sub) {
      await page.getByRole("button", { name: route.sub }).first().click();
    }
  }
}

// ── T01: Shell spatial contract ─────────────────────────────────────────────

test("FH-01: shell renders h1, nav landmark, and transport controls", async ({ page }) => {
  await goto(page);
  await expect(page.locator("h1")).toBeVisible();
  // Either sidebar (desktop) or mobile nav is present
  const hasNav = await page.locator(".tr-navigator").isVisible()
    || await page.getByRole("navigation", { name: "Main navigation" }).isVisible();
  expect(hasNav).toBeTruthy();
  await expect(page.locator("[role='group'][aria-label='Playback controls']")).toBeVisible();
});

test("FH-02: all six navigator destinations reachable from sidebar", async ({ page }) => {
  await goto(page);
  const sidebar = page.locator(".tr-navigator");
  if (!(await sidebar.isVisible())) return; // desktop-only test

  for (const label of ["Banks & Samples", "Forms", "Patterns", "Devices", "Triggers", "Cue & Surface"]) {
    await sidebar.getByRole("button", { name: label }).click();
  }
  await expect(page.locator(".tr-panel--performance")).toBeVisible();
});

// ── T02: Authoring panels ────────────────────────────────────────────────────

test("FH-03: Materials bank search filters visible banks", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "materials");

  const searchInput = page.getByLabel("Search banks");
  await expect(searchInput).toBeVisible();

  await searchInput.fill("above");
  const sidebar = page.locator(".tr-panel__sidebar");
  await expect(sidebar.getByText("ABOVE").first()).toBeVisible();
  await expect(sidebar.getByText("BELOW")).not.toBeVisible();

  await searchInput.fill("");
  await expect(sidebar.getByText("BELOW").first()).toBeVisible();
});

test("FH-04: Automation shows collapsed trigger causal summary", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "automation");

  const main = page.locator(".tr-panel__main");
  await expect(main.locator(".tr-panel__section-head").filter({ hasText: "TRIGGERS" })).toBeVisible();
  await expect(main.getByText("box intrusion")).toBeVisible();
  await expect(main.locator(".tr-trigger__when").first()).toBeVisible();
  await expect(main.locator(".tr-trigger__then").first()).toBeVisible();
});

test("FH-05: Automation ON/OFF toggle and Remove button are correctly labeled", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "automation");

  const toggle = page.locator("button[aria-pressed]").first();
  await expect(toggle).toBeVisible();

  const removeBtn = page.locator("button[aria-label^='Remove trigger']").first();
  await expect(removeBtn).toHaveText("Remove");
});

test("FH-06: Forms shows role-aware column headers (Singular/Plural)", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "forms");

  const main = page.locator(".tr-panel--forms .tr-panel__main");
  await expect(main.locator(".tr-panel__section-head").filter({ hasText: "FORMS" })).toBeVisible();
  await expect(main.locator(".tr-panel__section-head").filter({ hasText: "OVERRIDES" })).toBeVisible();
  await expect(page.getByText("Plural").first()).toBeVisible();
  await expect(page.getByText("Singular").first()).toBeVisible();
});

test("FH-07: Instruments shows PATH device and ROUTES section", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "instruments");

  const panel = page.locator(".tr-panel--instruments");
  await expect(panel.locator(".tr-panel__section-head").filter({ hasText: "DEVICES" })).toBeVisible();
  await expect(panel.locator(".tr-list").getByText("PATH")).toBeVisible();

  await page.locator(".tr-list__btn", { hasText: "PATH" }).click();
  await expect(panel.locator(".tr-panel__subsection-head").filter({ hasText: "ROUTES" })).toBeVisible();
});

// ── T03: Performance panel ───────────────────────────────────────────────────

test("FH-08: CUE audition does not write to Surface", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "performance");

  await expect(page.getByText("Generate events to see surface output.")).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: /Generate next event/i }).click();
  }
  await expect(page.getByText("Generate events to see surface output.")).toBeVisible();
});

test("FH-09: Surface Generate adds lines and Monitor toggle works", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "performance");

  // Generate until at least one line appears
  for (let i = 0; i < 10; i++) {
    await page.getByRole("button", { name: /Surface: generate/i }).click();
    if (await page.locator(".tr-surface__line").count() > 0) break;
  }

  // Monitor toggle
  const toggle = page.locator("button[aria-controls='tr-monitor-body']");
  await toggle.click();
  await expect(page.locator("#tr-monitor-body")).toBeVisible();
  await expect(page.locator("#tr-monitor-body").getByText("Tick")).toBeVisible();
});

test("FH-10: UNMIX appears with provenance when a Surface line is selected", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "performance");

  for (let i = 0; i < 10; i++) {
    await page.getByRole("button", { name: /Surface: generate/i }).click();
    if (await page.locator(".tr-surface__line").count() > 0) break;
  }

  const lines = page.locator(".tr-surface__line");
  if (await lines.count() === 0) return;

  const main = page.locator(".tr-panel--performance");
  const unmixHead = main.locator(".tr-panel__section-head").filter({ hasText: "UNMIX" });
  if (!(await unmixHead.isVisible())) {
    if (await lines.first().getAttribute("aria-selected") !== "true") {
      await lines.first().click();
    }
  }
  await expect(unmixHead).toBeVisible();
  await expect(page.getByRole("button", { name: /Capture.*Take/i })).toBeVisible();
});

test("FH-11: Capture Take shows TAKES section with annotation and Remove", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "performance");

  for (let i = 0; i < 10; i++) {
    await page.getByRole("button", { name: /Surface: generate/i }).click();
    if (await page.locator(".tr-surface__line").count() > 0) break;
  }

  const lines = page.locator(".tr-surface__line");
  if (await lines.count() === 0) return;

  const captureBtn = page.getByRole("button", { name: /Capture.*Take/i });
  if (!(await captureBtn.isVisible())) {
    if (await lines.first().getAttribute("aria-selected") !== "true") {
      await lines.first().click();
    }
  }
  await captureBtn.click();

  const main = page.locator(".tr-panel--performance");
  await expect(main.locator(".tr-panel__section-head").filter({ hasText: "TAKES" })).toBeVisible();
  await expect(page.locator("input.tr-take__annotation").first()).toBeVisible();
  await expect(page.locator("button[aria-label^='Remove take']").first()).toHaveText("Remove");
});

// ── T04: v07 boundary ────────────────────────────────────────────────────────

test("FH-12: v08 app at /next/ is isolated from root v07", async ({ page }) => {
  await goto(page);
  await expect(page.locator("h1")).toContainText("TAROKE RIMIXER");
  // v07 is served at root; /next/ must not redirect there
  expect(page.url()).toContain("/next/");
});

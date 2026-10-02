/**
 * final-horizon-authoring.spec.ts
 * CHK-T02-E2E: browser verification of T02 authoring chambers.
 * Materials bank search, Forms role-relevant overrides,
 * Automation collapsed causal summary, Instruments device master.
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = "/next/";

async function goto(page: Page) {
  await page.goto(BASE);
  await expect(page.locator("h1")).toContainText("TAROKE RIMIXER", { timeout: 10_000 });
}

// Map panel labels as they appear in the Navigator sidebar
const NAV_LABELS: Record<string, string> = {
  "materials": "Banks & Samples",
  "forms":     "Forms",
  "automation": "Triggers",
  "instruments": "Devices",
};
// Mobile nav top-level labels
const MOBILE_TOP: Record<string, { top: string; sub?: string }> = {
  "materials":   { top: "Material", sub: "Banks & Samples" },
  "forms":       { top: "Material", sub: "Forms" },
  "automation":  { top: "Automate" },
  "instruments": { top: "Devices" },
};

async function goToPanel(page: Page, panel: string) {
  const sidebar = page.locator(".tr-navigator");
  const isSidebarVisible = await sidebar.isVisible();
  if (isSidebarVisible) {
    const label = NAV_LABELS[panel] ?? panel;
    await sidebar.getByRole("button", { name: label }).click();
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

// ── Materials: bank search ──────────────────────────────────────────────────────

test("Materials: bank search input is present and labeled", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "materials");

  const searchInput = page.getByLabel("Search banks");
  await expect(searchInput).toBeVisible();
});

test("Materials: typing in search filters bank list", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "materials");

  const searchInput = page.getByLabel("Search banks");
  // ABOVE should be visible initially
  const sidebar = page.locator(".tr-panel__sidebar");
  await expect(sidebar.getByText("ABOVE").first()).toBeVisible();

  // Type "above" — only ABOVE should remain
  await searchInput.fill("above");
  await expect(sidebar.getByText("ABOVE").first()).toBeVisible();
  await expect(sidebar.getByText("BELOW")).not.toBeVisible();
});

test("Materials: clearing search restores all banks", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "materials");

  const sidebar = page.locator(".tr-panel__sidebar");
  const searchInput = page.getByLabel("Search banks");
  await searchInput.fill("above");
  await searchInput.fill("");
  await expect(sidebar.getByText("ABOVE").first()).toBeVisible();
  await expect(sidebar.getByText("BELOW").first()).toBeVisible();
});

// ── Automation: collapsed causal summary ───────────────────────────────────────

test("Automation: TRIGGERS heading and causal summary visible", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "automation");

  const main = page.locator(".tr-panel__main");
  await expect(main.locator(".tr-panel__section-head").filter({ hasText: "TRIGGERS" })).toBeVisible();
  await expect(main.getByText("box intrusion")).toBeVisible();
  await expect(main.locator(".tr-trigger__when").first()).toBeVisible();
  await expect(main.locator(".tr-trigger__then").first()).toBeVisible();
});

test("Automation: ON/OFF toggle has aria-pressed attribute", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "automation");

  const toggle = page.locator("button[aria-pressed]").first();
  await expect(toggle).toBeVisible();
  const pressed = await toggle.getAttribute("aria-pressed");
  expect(pressed === "true" || pressed === "false").toBeTruthy();
});

test("Automation: Remove button shows text 'Remove'", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "automation");

  const removeBtn = page.locator("button[aria-label^='Remove trigger']").first();
  await expect(removeBtn).toBeVisible();
  await expect(removeBtn).toHaveText("Remove");
});

test("Automation: clicking edit button shows expanded Condition bank select", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "automation");

  const editBtn = page.getByRole("button", { name: /Edit trigger box intrusion/i });
  await editBtn.click();

  const conditionBank = page.getByRole("combobox", { name: /Condition bank/i });
  await expect(conditionBank).toBeVisible();
});

// ── Instruments: device master ─────────────────────────────────────────────────

test("Instruments: DEVICES heading and PATH device listed", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "instruments");

  const panel = page.locator(".tr-panel--instruments");
  await expect(panel.locator(".tr-panel__section-head").filter({ hasText: "DEVICES" })).toBeVisible();
  await expect(panel.locator(".tr-list").getByText("PATH")).toBeVisible();
});

test("Instruments: selecting PATH shows ROUTES section", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "instruments");

  await page.locator(".tr-list__btn", { hasText: "PATH" }).click();
  const main = page.locator(".tr-panel__main");
  await expect(main.locator(".tr-panel__subsection-head").filter({ hasText: "ROUTES" })).toBeVisible();
});

// ── Forms: role-relevant overrides ────────────────────────────────────────────

test("Forms: FORMS and OVERRIDES headings visible", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "forms");

  const main = page.locator(".tr-panel--forms .tr-panel__main");
  await expect(main.locator(".tr-panel__section-head").filter({ hasText: "FORMS" })).toBeVisible();
  await expect(main.locator(".tr-panel__section-head").filter({ hasText: "OVERRIDES" })).toBeVisible();
});

test("Forms: noun banks show Singular and Plural column headers", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "forms");

  // ABOVE is a noun bank — should have Plural and Singular columns
  await expect(page.getByText("Plural").first()).toBeVisible();
  await expect(page.getByText("Singular").first()).toBeVisible();
});

test("Forms: no 'Plural override' text — role-aware column labels used", async ({ page }) => {
  await goto(page);
  await goToPanel(page, "forms");

  await expect(page.getByText("Plural override")).not.toBeVisible();
});

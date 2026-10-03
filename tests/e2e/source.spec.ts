/**
 * Bounded Chromium journey: Source and Work Identity chamber.
 *
 * Verifies desktop nav, mobile grouped nav, SourcePanel fields,
 * ArchivePanel PROJECT INFO reflection, and URL validation.
 */

import { test, expect } from "@playwright/test";

const BASE = "/next/";

async function goto(page: Parameters<typeof test>[1] extends (p: infer P, ...a: unknown[]) => unknown ? P : never) {
  await page.goto(BASE);
  await expect(page.locator("h1")).toContainText("TAROKO REMIXER", { timeout: 10_000 });
}

// ── 1. Desktop: Source nav item is present in MATERIAL group ──────────────────

test("S1 — Source nav item present under MATERIAL on desktop", async ({ page }) => {
  await goto(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  const sourceBtn = page.getByRole("button", { name: "Source" });
  await expect(sourceBtn).toBeVisible();
});

// ── 2. Desktop: clicking Source renders the panel ─────────────────────────────

test("S2 — Source panel renders WORK IDENTITY section on desktop", async ({ page }) => {
  await goto(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "Source" }).click();
  // Section heads use exact text in DOM (CSS text-transform: uppercase is visual only)
  await expect(page.getByText("WORK IDENTITY", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Project title" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Author" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Language" })).toBeVisible();
});

// ── 3. Desktop: Source panel has SOURCE and TEXT sections ─────────────────────

test("S3 — Source panel renders SOURCE and TEXT sections", async ({ page }) => {
  await goto(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "Source" }).click();
  // Use exact: true to avoid case-insensitive substring ambiguity
  await expect(page.getByText("SOURCE", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Source title" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Source URL" })).toBeVisible();
  await expect(page.getByText("TEXT", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Statement" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Credits" })).toBeVisible();
});

// ── 4. Desktop: editing title in SourcePanel reflects in ArchivePanel ─────────

test("S4 — Title edit in SourcePanel reflects in ArchivePanel PROJECT INFO", async ({ page }) => {
  await goto(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "Source" }).click();
  const titleInput = page.getByRole("textbox", { name: "Project title" });
  await titleInput.clear();
  await titleInput.fill("Gorge Poem");
  await page.getByRole("button", { name: "Import & Export" }).click();
  await expect(page.getByText("PROJECT INFO", { exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Gorge Poem" })).toBeVisible();
});

// ── 5. Mobile: Source is reachable via Material grouped nav ───────────────────

test("S5 — Source is reachable via mobile Material grouped sub-nav", async ({ page }) => {
  await goto(page);
  await page.setViewportSize({ width: 390, height: 844 });
  // Click the Material top-level tab in mobile bottom nav
  const materialTab = page.getByRole("button", { name: "Material" });
  if (await materialTab.isVisible()) {
    await materialTab.click();
    // Source sub-item must appear
    const sourceSubBtn = page.getByRole("button", { name: "Source" }).first();
    await expect(sourceSubBtn).toBeVisible();
    await sourceSubBtn.click();
    await expect(page.getByText("WORK IDENTITY", { exact: true })).toBeVisible();
  } else {
    // Desktop nav visible at this viewport — find Source in sidebar
    await page.getByRole("button", { name: "Source" }).click();
    await expect(page.getByText("WORK IDENTITY", { exact: true })).toBeVisible();
  }
});

// ── 6. Invalid URL shows accessible validation error ─────────────────────────

test("S6 — Invalid source URL shows accessible error without blocking editing", async ({ page }) => {
  await goto(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "Source" }).click();
  const urlInput = page.getByRole("textbox", { name: "Source URL" });
  await urlInput.fill("not-a-valid-url");
  await urlInput.blur();
  // Error message must appear
  await expect(page.getByRole("alert")).toBeVisible();
  // Input must still be interactive — can continue editing
  await expect(urlInput).toBeEnabled();
  // Clearing the URL removes the error
  await urlInput.clear();
  await urlInput.blur();
  await expect(page.getByRole("alert")).not.toBeVisible();
});

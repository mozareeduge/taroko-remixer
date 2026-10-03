/**
 * WP05 Accessibility audit — axe-core via Chromium injection.
 * Checks each panel for serious and critical violations.
 * All violations are reported; none are suppressed.
 */

import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve } from "path";

const BASE = "/next/";
const AXE_PATH = resolve(process.cwd(), "../../node_modules/axe-core/axe.js");

async function injectAxe(page: Page) {
  const axeSource = readFileSync(AXE_PATH, "utf-8");
  await page.evaluate(axeSource);
}

async function runAxe(page: Page, panelName: string): Promise<void> {
  const results = await page.evaluate(() => {
    return new Promise<{
      violations: { id: string; impact: string; description: string; nodes: { html: string }[] }[];
    }>((resolve) => {
      // @ts-expect-error axe injected globally
      window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "best-practice"] }, (_err: unknown, res: unknown) => {
        resolve(res as never);
      });
    });
  });

  const seriousOrCritical = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );

  if (seriousOrCritical.length > 0) {
    const report = seriousOrCritical
      .map(
        (v) =>
          `[${v.impact.toUpperCase()}] ${v.id}: ${v.description}\n` +
          `  Nodes: ${v.nodes.slice(0, 2).map((n) => n.html.slice(0, 80)).join(" | ")}`,
      )
      .join("\n");
    throw new Error(`axe violations in ${panelName}:\n${report}`);
  }
}

async function goto(page: Page) {
  await page.goto(BASE);
  await expect(page.locator("h1")).toContainText("TAROKO REMIXER", { timeout: 10_000 });
}

const NAV_LABELS_A11Y: Record<string, string> = {
  "Materials": "Banks & Samples",
  "Forms": "Forms",
  "Instruments": "Devices",
  "Composition": "Patterns",
  "Automation": "Triggers",
  "Performance": "Cue & Surface",
  "Archive": "Import & Export",
};

const MOBILE_NAV_A11Y: Record<string, { top: string; sub?: string }> = {
  "Banks & Samples": { top: "Material", sub: "Banks & Samples" },
  "Forms":           { top: "Material", sub: "Forms" },
  "Devices":         { top: "Devices" },
  "Patterns":        { top: "Compose" },
  "Triggers":        { top: "Automate" },
  "Cue & Surface":   { top: "Perform" },
  "Import & Export": { top: "Archive" },
};

async function clickNav(page: Page, label: string) {
  const desktopName = NAV_LABELS_A11Y[label] ?? label;

  if (await page.locator(".tr-navigator").isVisible()) {
    await page.getByRole("button", { name: desktopName }).click();
    return;
  }

  const route = MOBILE_NAV_A11Y[desktopName];
  if (!route) throw new Error(`No mobile nav route for "${desktopName}"`);
  await page.getByRole("button", { name: route.top }).click();
  if (route.sub) {
    await page.getByRole("button", { name: route.sub }).click();
  }
}

test("a11y — shell (no panel active)", async ({ page }) => {
  await goto(page);
  await injectAxe(page);
  await runAxe(page, "shell");
});

test("a11y — Materials panel", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Materials");
  await injectAxe(page);
  await runAxe(page, "Materials");
});

test("a11y — Forms panel", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Forms");
  await injectAxe(page);
  await runAxe(page, "Forms");
});

test("a11y — Instruments panel", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Instruments");
  await injectAxe(page);
  await runAxe(page, "Instruments");
});

test("a11y — Composition panel", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Composition");
  await injectAxe(page);
  await runAxe(page, "Composition");
});

test("a11y — Automation panel", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Automation");
  await injectAxe(page);
  await runAxe(page, "Automation");
});

test("a11y — Performance panel", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Performance");
  await injectAxe(page);
  await runAxe(page, "Performance");
});

test("a11y — Archive panel", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Archive");
  await injectAxe(page);
  await runAxe(page, "Archive");
});

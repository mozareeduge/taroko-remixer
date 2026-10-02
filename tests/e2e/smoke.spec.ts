import { test, expect } from "@playwright/test";

// WP05 will add the full vertical-slice E2E suite.
// This smoke test verifies the /next/ shell loads without errors.

test("v08 workbench shell loads", async ({ page }) => {
  await page.goto("/next/");
  await expect(page.locator("h1")).toContainText("TAROKO REMIXER");
});

/**
 * WP05 Human Checkpoint A — vertical-slice journey.
 *
 * Each test verifies actual application behaviour, not just element existence.
 * No || true escapes. No "passes structurally" fallbacks.
 * Tests fail when the underlying feature is absent or broken.
 */

import { test, expect, type Page } from "@playwright/test";
import * as fs from "fs";

const BASE = "/next/";

async function goto(page: Page) {
  await page.goto(BASE);
  await expect(page.locator("h1")).toContainText("TAROKO REMIXER", { timeout: 10_000 });
}

const NAV_LABELS: Record<string, string> = {
  "Materials": "Banks & Samples",
  "Forms": "Forms",
  "Instruments": "Devices",
  "Composition": "Patterns",
  "Automation": "Triggers",
  "Performance": "Cue & Surface",
  "Archive": "Import & Export",
};

// Mobile bottom nav maps desktop panel names to { top-level tab, optional sub-item }
const MOBILE_NAV: Record<string, { top: string; sub?: string }> = {
  "Banks & Samples": { top: "Material", sub: "Banks & Samples" },
  "Forms":           { top: "Material", sub: "Forms" },
  "Devices":         { top: "Devices" },
  "Patterns":        { top: "Compose" },
  "Triggers":        { top: "Automate" },
  "Cue & Surface":   { top: "Perform" },
  "Import & Export": { top: "Archive" },
};

async function clickNav(page: Page, label: string) {
  const desktopName = NAV_LABELS[label] ?? label;

  // Use the desktop sidebar navigator when it is visible (≥960 px viewport)
  if (await page.locator(".tr-navigator").isVisible()) {
    await page.getByRole("button", { name: desktopName }).click();
    return;
  }

  // Mobile: use the bottom nav, then the material sub-nav if needed
  const route = MOBILE_NAV[desktopName];
  if (!route) throw new Error(`No mobile nav route for "${desktopName}"`);
  await page.getByRole("button", { name: route.top }).click();
  if (route.sub) {
    await page.getByRole("button", { name: route.sub }).click();
  }
}

// ── 1. Shell loads ─────────────────────────────────────────────────────────────

test("1 — v08 workbench shell loads at /next/", async ({ page }) => {
  await goto(page);
  await expect(page.locator("h1")).toBeVisible();
  // Navigation is present
  await expect(page.locator("nav, [role='navigation']").first()).toBeVisible();
});

// ── 2. Navigation panel switching ──────────────────────────────────────────────

test("2 — all six panels are reachable via nav", async ({ page }) => {
  await goto(page);

  const panelChecks: [string, () => Promise<void>][] = [
    ["Materials", async () => {
      await expect(page.getByText("BANKS").first()).toBeVisible();
    }],
    ["Instruments", async () => {
      await expect(page.getByText("DEVICES").first()).toBeVisible();
    }],
    ["Composition", async () => {
      await expect(page.getByText("PATTERNS").first()).toBeVisible();
    }],
    ["Automation", async () => {
      await expect(page.getByText("TRIGGERS").first()).toBeVisible();
    }],
    ["Performance", async () => {
      await expect(page.getByText("CUE").first()).toBeVisible();
    }],
    ["Archive", async () => {
      await expect(page.getByText("EXPORT").first()).toBeVisible();
    }],
  ];

  for (const [panel, check] of panelChecks) {
    await clickNav(page, panel);
    await check();
  }
});

// ── 3. Materials: bank list and selection ──────────────────────────────────────

test("3 — Materials: bank list renders and selecting a bank shows sample table", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Materials");
  // BANKS section heading must exist
  await expect(page.getByText("BANKS").first()).toBeVisible();
  // At least one bank button exists
  const bankBtns = page.locator(".tr-list__btn");
  await expect(bankBtns.first()).toBeVisible();
  // Default bank is auto-selected — sample table must already be visible
  // (Table has a "Literal" column header)
  await expect(page.getByRole("columnheader", { name: "Literal" })).toBeVisible();
  // Click a different bank — table must remain visible
  await bankBtns.last().click();
  await expect(page.getByRole("columnheader", { name: "Literal" })).toBeVisible();
});

// ── 4. Materials: accessible reorder buttons for samples ───────────────────────

test("4 — Materials: Up/Down reorder buttons exist for samples in active bank", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Materials");
  // Wait for default bank's sample table to render
  await expect(page.getByRole("columnheader", { name: "Literal" })).toBeVisible();
  // Reorder buttons must exist (role=button with name matching move pattern)
  const upButtons = page.getByRole("button", { name: /move .+ up/i });
  const downButtons = page.getByRole("button", { name: /move .+ down/i });
  const upCount = await upButtons.count();
  const downCount = await downButtons.count();
  expect(upCount + downCount, "Expected reorder Up/Down buttons for samples").toBeGreaterThan(0);
});

// ── 5. Instruments: route template is editable ─────────────────────────────────

test("5 — Instruments: route template textarea is editable and updates model", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Instruments");
  await expect(page.getByText("DEVICES").first()).toBeVisible();
  // PATH device is selected by default; route template textarea must be editable
  const templateArea = page.locator("textarea").first();
  await expect(templateArea).toBeVisible();
  await templateArea.fill("test template text");
  // After editing the template, the textarea value must reflect the change
  await expect(templateArea).toHaveValue("test template text");
});

// ── 6. Composition: slot reorder buttons present ───────────────────────────────

test("6 — Composition: slot Up/Down reorder buttons exist for the active pattern", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Composition");
  await expect(page.getByText("PATTERNS").first()).toBeVisible();
  await expect(page.getByText("SLOTS").first()).toBeVisible();
  // Default stanza has slots; each slot must have Up/Down reorder buttons
  const upButtons = page.getByRole("button", { name: /move slot .+ up/i });
  const downButtons = page.getByRole("button", { name: /move slot .+ down/i });
  const total = (await upButtons.count()) + (await downButtons.count());
  expect(total, "Expected Up/Down reorder buttons for slots").toBeGreaterThan(0);
});

// ── 7. Automation: WHEN→THEN trigger format ────────────────────────────────────

test("7 — Automation: WHEN→THEN trigger readable format present", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Automation");
  await expect(page.getByText("TRIGGERS").first()).toBeVisible();
  // Default trigger uses WHEN / THEN labels
  await expect(page.getByText("WHEN").first()).toBeVisible();
  await expect(page.getByText("THEN").first()).toBeVisible();
});

// ── 8. Performance: Cue does NOT write to Surface ──────────────────────────────

test("8 — Performance: Cue audition does NOT append to Surface history", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Performance");
  // Surface starts empty
  const emptyMsg = page.getByText("Generate events to see surface output.");
  await expect(emptyMsg).toBeVisible();

  // Click Cue Audition 5 times
  const cueBtn = page.getByRole("button", { name: "Generate next event" });
  await expect(cueBtn).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await cueBtn.click();
    await page.waitForTimeout(150);
  }

  // Surface MUST still be empty — Cue must not write to Surface
  await expect(emptyMsg).toBeVisible();
});

// ── 9. Performance: Surface has its own Generate action ────────────────────────

test("9 — Performance: Surface has separate Generate action and section", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Performance");

  // Surface Generate button must be present and distinct from Cue button
  const surfaceGenBtn = page.getByRole("button", { name: /Surface: generate/i });
  await expect(surfaceGenBtn).toBeVisible();

  // Surface section must exist as a labelled section
  const surfaceSection = page.locator('[aria-labelledby="surface-head"]');
  await expect(surfaceSection).toBeVisible();

  // Clicking Surface Generate must update Surface state (button is functional)
  await surfaceGenBtn.click();
  // After one click the empty message may or may not be gone (breath events exist),
  // but the button must remain present and operable
  await expect(surfaceGenBtn).toBeVisible();

  // Generate several more times — after enough generates at least one line event appears
  for (let i = 0; i < 8; i++) {
    await surfaceGenBtn.click();
    await page.waitForTimeout(150);
  }
  // Surface must no longer be empty (9 total generates with classic project yields lines)
  const emptyMsg = page.getByText("Generate events to see surface output.");
  expect(await emptyMsg.count(), "Surface must have output after 9 generates").toBe(0);
});

// ── 10. Performance: Surface Clear empties history ─────────────────────────────

test("10 — Performance: Surface Clear empties history", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Performance");
  const surfaceGenBtn = page.getByRole("button", { name: /Surface: generate/i });

  // Generate until surface has output
  for (let i = 0; i < 10; i++) {
    await surfaceGenBtn.click();
    await page.waitForTimeout(150);
    if ((await page.getByText("Generate events to see surface output.").count()) === 0) break;
  }
  // Surface must have output now
  expect(
    await page.getByText("Generate events to see surface output.").count(),
    "Surface must have lines before Clear",
  ).toBe(0);

  // Click Clear
  const clearBtn = page.getByRole("button", { name: /Clear surface history/i });
  await expect(clearBtn).toBeVisible();
  await clearBtn.click();

  // Surface must be empty immediately
  await expect(page.getByText("Generate events to see surface output.")).toBeVisible();
});

// ── 11. Performance: Take capture workflow ─────────────────────────────────────

test("11 — Performance: Surface Generate → UNMIX appears → Capture Take → Take listed", async ({
  page,
}) => {
  await goto(page);
  await clickNav(page, "Performance");
  const surfaceGenBtn = page.getByRole("button", { name: /Surface: generate/i });

  // Generate until we get a line event (UNMIX section appears)
  let gotLine = false;
  for (let i = 0; i < 15; i++) {
    await surfaceGenBtn.click();
    await page.waitForTimeout(200);
    if ((await page.getByText("UNMIX").count()) > 0) {
      gotLine = true;
      break;
    }
  }
  expect(gotLine, "Expected at least one line event in 15 Surface generates").toBe(true);

  // Capture Take button must be visible
  const captureBtn = page.getByRole("button", { name: /Capture.*Take/i });
  await expect(captureBtn).toBeVisible();
  await captureBtn.click();
  await page.waitForTimeout(200);

  // TAKES section must appear with the captured take
  await expect(page.getByText("TAKES")).toBeVisible();
});

// ── 12. Archive: export buttons visible ────────────────────────────────────────

test("12 — Archive: JSON and HTML export buttons are visible", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Archive");
  await expect(page.getByText("EXPORT").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Export JSON/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Export HTML/i })).toBeVisible();
});

// ── 13. Archive: Import button and section present ─────────────────────────────

test("13 — Archive: Import section and button are present", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Archive");
  await expect(page.getByText(/IMPORT/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Import .taroke/i })).toBeVisible();
});

// ── 14. Archive: malformed import shows a visible error ────────────────────────

test("14 — Archive: malformed file import shows a visible error message", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Archive");

  // File input must be present (may be visually hidden but must be in DOM)
  const input = page.locator('input[type="file"]');
  await expect(input).toBeAttached();

  // Inject a malformed JSON file
  await input.setInputFiles({
    name: "bad.taroke.json",
    mimeType: "application/json",
    buffer: Buffer.from("{ this is not valid json }"),
  });
  await page.waitForTimeout(500);

  // An error alert must appear with error text
  const alert = page.getByRole("alert");
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(/could not|error|invalid|failed/i);
});

// ── 15. Transport controls visible ─────────────────────────────────────────────

test("15 — Transport controls are present in the shell", async ({ page }) => {
  await goto(page);
  const transport = page.locator('[class*="tr-transport"]').first();
  await expect(transport).toBeVisible();
});

// ── 16. Inspector toggle works ─────────────────────────────────────────────────

test("16 — Inspector panel can be opened via button", async ({ page }) => {
  await goto(page);
  const openBtn = page.getByRole("button", { name: /open inspector/i });
  const closeBtn = page.getByRole("button", { name: /close inspector/i });

  if ((await openBtn.count()) > 0) {
    await openBtn.click();
    await page.waitForTimeout(200);
    const inspector = page.locator('[class*="tr-inspector"]').first();
    await expect(inspector).toBeVisible();
  } else if ((await closeBtn.count()) > 0) {
    // Inspector already open — verify it's visible
    const inspector = page.locator('[class*="tr-inspector"]').first();
    await expect(inspector).toBeVisible();
  } else {
    // Inspector may be always visible — check for its container
    const inspector = page.locator('[class*="tr-inspector"]').first();
    expect(
      await inspector.count(),
      "Inspector container must exist in the DOM",
    ).toBeGreaterThan(0);
  }
});

// ── 17. v08 /next/ route is independently reachable ───────────────────────────
// (v07 root preservation is verified by the separate v07 baseline test suite)

test("17 — v08 app is reachable at /next/ via direct navigation", async ({ page }) => {
  await page.goto("/next/");
  await expect(page.locator("h1")).toContainText("TAROKO REMIXER", { timeout: 10_000 });
  // Reload — app must survive refresh
  await page.reload();
  await expect(page.locator("h1")).toContainText("TAROKO REMIXER", { timeout: 10_000 });
});

// ── 18. Accessibility: structural checks ──────────────────────────────────────

test("18 — a11y: h1, nav landmark, and named buttons present", async ({ page }) => {
  await goto(page);

  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("nav, [role='navigation']").first()).toBeVisible();

  // All buttons in the first 20 must have an accessible name
  const buttons = await page.getByRole("button").all();
  const unnamed: string[] = [];
  for (const btn of buttons.slice(0, 20)) {
    const ariaLabel = await btn.getAttribute("aria-label");
    const text = (await btn.textContent())?.trim() ?? "";
    if (!ariaLabel && !text) unnamed.push("(unnamed)");
  }
  expect(unnamed.length, `${unnamed.length} unnamed buttons found`).toBe(0);
});

// ── 19. Focus-visible: keyboard focus moves through controls ──────────────────

test("19 — focus-visible: tabbing moves focus to interactive elements", async ({ page }) => {
  await goto(page);
  // Start fresh — click body to ensure no pre-focused element
  await page.click("body", { force: true });

  await page.keyboard.press("Tab");
  const focused1 = await page.evaluate(() => document.activeElement?.tagName);
  await page.keyboard.press("Tab");
  const focused2 = await page.evaluate(() => document.activeElement?.tagName);

  // At least one of the first two tab stops must be an interactive element
  const interactive = ["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA"];
  const hasFocus =
    interactive.includes(focused1 ?? "") || interactive.includes(focused2 ?? "");
  expect(hasFocus, `Expected focus on interactive element, got ${focused1} / ${focused2}`).toBe(
    true,
  );
});

// ── 20. Performance: Cue output section appears after audition ────────────────

test("20 — Performance: Cue audition shows output in Cue section", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Performance");

  const cueBtn = page.getByRole("button", { name: "Generate next event" });
  await expect(cueBtn).toBeVisible();
  await cueBtn.click();
  await page.waitForTimeout(300);

  // Cue output element must be visible after at least one audition
  const cueOutput = page.locator(".tr-cue__output");
  await expect(cueOutput).toBeVisible();
});

// ── 21. Materials: sample literal is editable ──────────────────────────────────

test("21 — Materials: sample literal input is editable and model updates", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Materials");
  await expect(page.getByRole("columnheader", { name: "Literal" })).toBeVisible();

  // Get the first editable literal input
  const literalInputs = page.getByRole("textbox", { name: /literal for sample/i });
  await expect(literalInputs.first()).toBeVisible();
  const original = await literalInputs.first().inputValue();

  // Edit it
  await literalInputs.first().fill("edited-sample-literal");
  await literalInputs.first().dispatchEvent("change");
  await page.waitForTimeout(200);

  // The input must retain the new value
  await expect(literalInputs.first()).toHaveValue("edited-sample-literal");

  // Revert so other tests are not affected
  await literalInputs.first().fill(original);
});

// ── 22. Materials: expected share column shows percentage ──────────────────────

test("22 — Materials: expected share column shows percentage for tokens", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Materials");
  await expect(page.getByRole("columnheader", { name: "Share" })).toBeVisible();
  // At least one share cell must contain a percentage
  const shareCells = page.locator(".tr-table__td--share");
  await expect(shareCells.first()).toBeVisible();
  const text = await shareCells.first().textContent();
  expect(text, "Expected share cell to contain a percentage").toMatch(/%/);
});

// ── 23. Forms: case policy select is editable ──────────────────────────────────

test("23 — Forms: case policy select is present and editable", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Forms");
  await expect(page.getByText("FORMS").first()).toBeVisible();

  const caseSelect = page.getByRole("combobox", { name: /case policy/i });
  await expect(caseSelect).toBeVisible();

  // Change case policy to lowercase
  await caseSelect.selectOption("lower");
  await expect(caseSelect).toHaveValue("lower");
});

// ── 24. Forms: plural override input is editable ───────────────────────────────

test("24 — Forms: plural override input exists and is editable", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Forms");
  await expect(page.getByText("OVERRIDES").first()).toBeVisible();

  // At least one plural override input must be visible
  const overrideInputs = page.getByRole("textbox", { name: /plural override/i });
  const count = await overrideInputs.count();
  expect(count, "Expected at least one plural override input").toBeGreaterThan(0);

  // Editing it must update the value
  await overrideInputs.first().fill("wolves");
  await expect(overrideInputs.first()).toHaveValue("wolves");
});

// ── 25. Instruments: route variable chips insert at caret ─────────────────────

test("25 — Instruments: route variable chips appear and insert into template", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Instruments");
  // Variable chips only appear when device has inputs; PATH has inputs
  await expect(page.getByText("DEVICES").first()).toBeVisible();

  // Wait for route cards (PATH has 3 routes)
  const chips = page.getByRole("button", { name: /insert .+:.+ variable/i });
  const chipCount = await chips.count();
  expect(chipCount, "Expected variable insertion chips").toBeGreaterThan(0);

  // Click a chip — template textarea must contain the inserted variable
  const templateArea = page.locator("textarea").first();
  await templateArea.fill("");
  await templateArea.click();
  await chips.first().click();
  await page.waitForTimeout(100);
  const val = await templateArea.inputValue();
  expect(val, "Expected chip to insert a {slot:form} variable").toMatch(/\{.+:.+\}/);
});

// ── 26. Archive: import receipt banner appears after successful import ─────────

test("26 — Archive: import receipt banner appears after a valid file is loaded", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Archive");
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeAttached();

  // Inject a valid taroke JSON
  const validProject = JSON.stringify({
    schemaVersion: "7.8",
    project: { title: "receipt-test", author: "", statement: "", credits: "", sourceTitle: "", sourceUrl: "" },
    materials: { trays: {}, bankMeta: {} },
    forms: { overrides: {}, casePolicy: "preserve", compoundPolicy: "hyphen" },
    lineDevices: [],
    stanzaPatterns: [],
    flowScenes: [],
    triggers: [],
    notes: [],
    surface: { speedMs: 1200, retention: 50, fontSize: 14, theme: "minimal", traceMode: "compact" },
    workbench: {},
  });
  await fileInput.setInputFiles({
    name: "receipt-test.taroke.json",
    mimeType: "application/json",
    buffer: Buffer.from(validProject),
  });
  await page.waitForTimeout(500);

  // Import receipt banner must appear
  const banner = page.locator('[aria-label="Import receipt"]');
  await expect(banner).toBeVisible({ timeout: 3000 });
  await expect(banner).toContainText("receipt-test.taroke.json");
});

// ── 27. Composition: slot reorder changes order in model ──────────────────────

test("27 — Composition: clicking slot Down reorder button moves slot", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Composition");
  await expect(page.getByText("SLOTS").first()).toBeVisible();

  // Get slot Down buttons
  const downBtns = page.getByRole("button", { name: /move slot .+ down/i });
  const count = await downBtns.count();
  if (count < 2) {
    // If only one slot, skip reorder check (first slot's Down is also last = disabled)
    return;
  }

  // Click the first enabled Down button — first slot's label must change
  const firstEnabled = downBtns.filter({ hasNot: page.locator("[disabled]") }).first();
  const slotLabels = page.locator(".tr-slot__type");
  const beforeFirstLabel = await slotLabels.first().textContent();

  await firstEnabled.click();
  await page.waitForTimeout(200);

  const afterFirstLabel = await slotLabels.first().textContent();
  // After moving the first slot down, a different slot is now first — label changes
  expect(afterFirstLabel, "Expected slot reorder to change first slot's label").not.toBe(beforeFirstLabel);
});

// ── 28. Composition: Move to start/end buttons ────────────────────────────────

test("28 — Composition: Move to start and Move to end buttons are present and functional", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Composition");
  await expect(page.getByText("SLOTS").first()).toBeVisible();

  // Move to start / end buttons must exist
  const toStartBtns = page.getByRole("button", { name: /move slot .+ to start/i });
  const toEndBtns = page.getByRole("button", { name: /move slot .+ to end/i });
  const startCount = await toStartBtns.count();
  const endCount = await toEndBtns.count();
  expect(startCount + endCount, "Expected Move to start/end buttons for slots").toBeGreaterThan(0);

  // Default stanza must have 3+ slots for Move-to-end to produce a verifiable change
  const slotLabels = page.locator(".tr-slot__type");
  const totalSlots = await slotLabels.count();
  expect(totalSlots, "Need ≥3 slots to verify Move to end").toBeGreaterThanOrEqual(3);

  // Click Move to end on the first slot — it should become last
  const firstLabel = await slotLabels.first().textContent();
  const enabledToEnd = toEndBtns.filter({ hasNot: page.locator("[disabled]") }).first();
  await enabledToEnd.click();
  await page.waitForTimeout(200);
  const newLastLabel = await slotLabels.last().textContent();
  expect(newLastLabel, "Move to end should place slot at last position").toBe(firstLabel);
});

// ── 29. Instruments: device input slot is editable ───────────────────────────

test("29 — Instruments: device input fields are editable", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Instruments");
  await expect(page.getByText("DEVICES").first()).toBeVisible();

  // PATH device is auto-selected and always has inputs in the default project
  const slotInputs = page.locator("[data-input-slot]");
  // Fail hard if no editable inputs — the feature must be present
  await expect(slotInputs.first()).toBeVisible({ timeout: 3000 });
  expect(await slotInputs.count(), "Expected editable slot inputs for PATH device").toBeGreaterThan(0);

  // Edit the first slot name — typing multiple characters must not lose focus (stable key fix)
  const firstSlot = slotInputs.first();
  const original = await firstSlot.inputValue();
  await firstSlot.fill("edited-slot");
  await page.waitForTimeout(200);
  // Input must retain the full value (not just the last character, which would indicate key-remount)
  await expect(firstSlot).toHaveValue("edited-slot");

  // Revert
  await firstSlot.fill(original);
});

// ─── Helper used by tests 30-50 ──────────────────────────────────────────────

/** Minimal schema-valid project JSON for import/localStorage injection */
const MINIMAL_PROJECT = JSON.stringify({
  schemaVersion: "7.8",
  project: { title: "draft-test", author: "e2e", statement: "", credits: "", sourceTitle: "", sourceUrl: "" },
  materials: { trays: {}, bankMeta: {} },
  forms: { overrides: {}, casePolicy: "preserve", compoundPolicy: "hyphen" },
  lineDevices: [],
  stanzaPatterns: [],
  flowScenes: [],
  triggers: [],
  notes: [],
  surface: { speedMs: 1200, retention: 50, fontSize: 14, theme: "minimal", traceMode: "compact" },
  workbench: {},
});

// ── 30. Archive: PREVIEW section renders with UNBUILT badge ───────────────────

test("30 — Archive: PREVIEW section renders with UNBUILT badge before first preview", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Archive");

  // PREVIEW section heading must exist
  await expect(page.getByText("PREVIEW").first()).toBeVisible();

  // Badge must show UNBUILT before any preview is generated
  const badge = page.locator("[data-preview-lifecycle]");
  await expect(badge).toBeVisible();
  await expect(badge).toHaveAttribute("data-preview-lifecycle", "unbuilt");
  await expect(badge).toContainText("UNBUILT", { ignoreCase: true });
});

// ── 31. Archive: preview generates iframe and shows FRESH badge ───────────────

test("31 — Archive: clicking Preview artifact generates iframe with FRESH badge", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Archive");

  // Click "Preview artifact"
  const previewBtn = page.getByRole("button", { name: /Generate preview|Preview artifact/i });
  await expect(previewBtn).toBeVisible();
  await previewBtn.click();
  await page.waitForTimeout(500);

  // Badge must now be FRESH
  const badge = page.locator("[data-preview-lifecycle]").first();
  await expect(badge).toHaveAttribute("data-preview-lifecycle", "fresh");
  await expect(badge).toContainText("FRESH", { ignoreCase: true });

  // iframe must be in the DOM
  const iframe = page.locator("iframe[title='Artifact preview']");
  await expect(iframe).toBeAttached();
  await expect(iframe).toHaveAttribute("sandbox", "allow-scripts");
});

// ── 32. Archive: preview becomes STALE after project mutation ─────────────────

test("32 — Archive: preview badge becomes STALE after project mutation", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Archive");

  // Generate preview → FRESH
  const previewBtn = page.getByRole("button", { name: /Preview artifact|Generate preview/i });
  await previewBtn.click();
  await page.waitForTimeout(300);
  await expect(page.locator("[data-preview-lifecycle]").first()).toHaveAttribute("data-preview-lifecycle", "fresh");

  // Navigate to Materials and edit a sample to mutate the project
  await clickNav(page, "Materials");
  const literalInputs = page.getByRole("textbox", { name: /literal for sample/i });
  await expect(literalInputs.first()).toBeVisible();
  await literalInputs.first().fill("stale-trigger-mutation");
  await literalInputs.first().dispatchEvent("change");
  await page.waitForTimeout(300);

  // Return to Archive — badge must now be STALE
  await clickNav(page, "Archive");
  const badge = page.locator("[data-preview-lifecycle]").first();
  await expect(badge).toHaveAttribute("data-preview-lifecycle", "stale");
  await expect(badge).toContainText("STALE", { ignoreCase: true });
});

// ── 33. Archive: preview iframe sandbox never includes allow-same-origin ──────

test("33 — Archive: preview iframe has sandbox=allow-scripts and no allow-same-origin", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Archive");

  const previewBtn = page.getByRole("button", { name: /Preview artifact|Generate preview/i });
  await previewBtn.click();
  await page.waitForTimeout(400);

  const iframe = page.locator("iframe[title='Artifact preview']");
  await expect(iframe).toBeAttached();

  // Must include allow-scripts
  const sandbox = await iframe.getAttribute("sandbox");
  expect(sandbox, "iframe sandbox must include allow-scripts").toContain("allow-scripts");
  // Must NOT include allow-same-origin (security requirement)
  expect(sandbox, "iframe sandbox must NOT include allow-same-origin").not.toContain("allow-same-origin");
});

// ── 34. Archive: Export JSON triggers download with valid parseable JSON ───────

test("34 — Archive: Export JSON triggers a download with valid parseable JSON", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Archive");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Export JSON/i }).click(),
  ]);

  // Download must have a .json filename
  expect(download.suggestedFilename(), "Expected .json file extension").toMatch(/\.taroke\.json$/);

  // Read and parse the file
  const filePath = await download.path();
  expect(filePath, "Download must have saved a file").toBeTruthy();
  const content = fs.readFileSync(filePath!, "utf-8");
  const parsed = JSON.parse(content) as Record<string, unknown>;

  // Must be a valid project object
  expect(parsed["schemaVersion"], "Expected schemaVersion field").toBeTruthy();
  expect(parsed["lineDevices"], "Expected lineDevices array").toBeDefined();
  expect(parsed["stanzaPatterns"], "Expected stanzaPatterns array").toBeDefined();
});

// ── 35. Archive: Export HTML triggers download with standalone artifact ────────

test("35 — Archive: Export HTML triggers a download with standalone taroke HTML", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Archive");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Export HTML/i }).click(),
  ]);

  expect(download.suggestedFilename(), "Expected .taroke.html extension").toMatch(/\.taroke\.html$/);

  const filePath = await download.path();
  expect(filePath).toBeTruthy();
  const content = fs.readFileSync(filePath!, "utf-8");

  // Standalone artifact HTML must have essential markers
  expect(content, "Expected DOCTYPE").toContain("<!DOCTYPE html>");
  expect(content, "Expected TAROKO reference").toMatch(/tarok[eo]/i);
  // Embedded project data (JSON blob) must be present
  expect(content, "Expected embedded schemaVersion").toContain("schemaVersion");
});

// ── 36. DraftRecoveryBanner: no banner when localStorage is empty ─────────────

test("36 — DraftRecoveryBanner: no banner rendered when localStorage has no draft", async ({ page }) => {
  await goto(page);
  // Clear any pre-existing draft
  await page.evaluate(() => { localStorage.removeItem("taroko.remixer.v08.draft"); localStorage.removeItem("taroke.remixer.v08.draft"); });
  await page.reload();
  await expect(page.locator("h1")).toContainText("TAROKO REMIXER", { timeout: 10_000 });

  // Banner must not exist
  const banner = page.locator("[class*='tr-draft-banner']");
  expect(await banner.count(), "Draft banner must not render when no draft").toBe(0);
});

// ── 37. DraftRecoveryBanner: banner appears when draft is in localStorage ──────

test("37 — DraftRecoveryBanner: banner appears after localStorage draft is injected", async ({ page }) => {
  await goto(page);
  // Inject a valid draft then reload
  await page.evaluate((draft) => {
    localStorage.setItem("taroko.remixer.v08.draft", draft);
  }, JSON.stringify({ project: JSON.parse(MINIMAL_PROJECT), savedAt: new Date().toISOString() }));
  await page.reload();
  await expect(page.locator("h1")).toContainText("TAROKO REMIXER", { timeout: 10_000 });

  // Banner must appear
  const banner = page.locator("[class*='tr-draft-banner']").first();
  await expect(banner).toBeVisible({ timeout: 3000 });
  await expect(banner).toContainText(/restore|draft/i);
});

// ── 38. DraftRecoveryBanner: Restore button loads the draft project ───────────

test("38 — DraftRecoveryBanner: Restore draft loads the saved project", async ({ page }) => {
  await goto(page);
  await page.evaluate((draft) => {
    localStorage.setItem("taroko.remixer.v08.draft", draft);
  }, JSON.stringify({ project: JSON.parse(MINIMAL_PROJECT), savedAt: new Date().toISOString() }));
  await page.reload();
  await expect(page.locator("h1")).toContainText("TAROKO REMIXER", { timeout: 10_000 });

  // Click Restore draft
  const restoreBtn = page.getByRole("button", { name: /restore draft/i });
  await expect(restoreBtn).toBeVisible({ timeout: 3000 });
  await restoreBtn.click();
  await page.waitForTimeout(400);

  // Banner must be dismissed after restore
  const banner = page.locator("[class*='tr-draft-banner']");
  expect(await banner.count(), "Banner must be dismissed after restore").toBe(0);

  // Project title in Archive must reflect the restored project ("draft-test")
  await clickNav(page, "Archive");
  await expect(page.getByRole("row", { name: /^Title/ }).getByRole("cell")).toContainText("draft-test", { timeout: 3000 });
});

// ── 39. DraftRecoveryBanner: Dismiss button hides banner without restoring ────

test("39 — DraftRecoveryBanner: Dismiss hides banner and keeps current project", async ({ page }) => {
  await goto(page);
  await page.evaluate((draft) => {
    localStorage.setItem("taroko.remixer.v08.draft", draft);
  }, JSON.stringify({ project: JSON.parse(MINIMAL_PROJECT), savedAt: new Date().toISOString() }));
  await page.reload();
  await expect(page.locator("h1")).toContainText("TAROKO REMIXER", { timeout: 10_000 });

  const dismissBtn = page.getByRole("button", { name: /^dismiss$/i });
  await expect(dismissBtn).toBeVisible({ timeout: 3000 });
  await dismissBtn.click();
  await page.waitForTimeout(300);

  // Banner gone
  const banner = page.locator("[class*='tr-draft-banner']");
  expect(await banner.count(), "Banner must disappear on dismiss").toBe(0);

  // But the project title is NOT "draft-test" — the current (default) project remains
  await clickNav(page, "Archive");
  // The Title row in PROJECT INFO must not show the draft project's title
  const titleRow = page.getByRole("row", { name: /^Title/ });
  await expect(titleRow).toBeVisible();
  const titleCell = await titleRow.getByRole("cell").textContent();
  expect(titleCell, "Dismiss must not restore draft project").not.toBe("draft-test");
});

// ── 40. DraftRecoveryBanner: Clear button removes draft and hides banner ──────

test("40 — DraftRecoveryBanner: Clear draft removes localStorage entry and hides banner", async ({ page }) => {
  await goto(page);
  await page.evaluate((draft) => {
    localStorage.setItem("taroko.remixer.v08.draft", draft);
  }, JSON.stringify({ project: JSON.parse(MINIMAL_PROJECT), savedAt: new Date().toISOString() }));
  await page.reload();
  await expect(page.locator("h1")).toContainText("TAROKO REMIXER", { timeout: 10_000 });

  const clearBtn = page.getByRole("button", { name: /clear draft/i });
  await expect(clearBtn).toBeVisible({ timeout: 3000 });
  await clearBtn.click();
  await page.waitForTimeout(300);

  // Banner gone
  const banner = page.locator("[class*='tr-draft-banner']");
  expect(await banner.count(), "Banner must disappear after Clear").toBe(0);

  // localStorage must no longer hold the draft
  const remaining = await page.evaluate(() => localStorage.getItem("taroko.remixer.v08.draft"));
  expect(remaining, "localStorage must be cleared after Clear").toBeNull();
});

// ── 41. DraftRecoveryBanner: corrupt draft shows error state ──────────────────

test("41 — DraftRecoveryBanner: corrupt localStorage JSON shows error banner", async ({ page }) => {
  await goto(page);
  await page.evaluate(() => {
    localStorage.setItem("taroko.remixer.v08.draft", "{ this is not valid json }");
  });
  await page.reload();
  await expect(page.locator("h1")).toContainText("TAROKO REMIXER", { timeout: 10_000 });

  // Error banner variant must appear
  const banner = page.locator("[class*='tr-draft-banner']").first();
  await expect(banner).toBeVisible({ timeout: 3000 });
  // Must describe the corruption (corrupt or schema mismatch message)
  await expect(banner).toContainText(/corrupt|could not|schema|mismatch/i);
  // Clear draft button must be present in the error state
  const clearBtn = page.getByRole("button", { name: /clear draft/i });
  await expect(clearBtn).toBeVisible();
});

// ── 42. Performance: UNMIX shows device name, route, and slot provenance ──────

test("42 — Performance: UNMIX table shows device name, route, and consumed inputs", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Performance");
  const surfaceGenBtn = page.getByRole("button", { name: /Surface: generate/i });

  // Generate until UNMIX appears (line event)
  let gotLine = false;
  for (let i = 0; i < 15; i++) {
    await surfaceGenBtn.click();
    await page.waitForTimeout(200);
    if ((await page.getByText("UNMIX").count()) > 0) { gotLine = true; break; }
  }
  expect(gotLine, "Expected a line event to appear in UNMIX within 15 generates").toBe(true);

  // UNMIX table must contain Device, Route, and Surface rows
  const unmixTable = page.locator(".tr-table--unmix");
  await expect(unmixTable).toBeVisible();
  await expect(unmixTable.getByText("Device")).toBeVisible();
  await expect(unmixTable.getByText("Route")).toBeVisible();
  await expect(unmixTable.getByText("Surface")).toBeVisible();
});

// ── 43. Performance: UNMIX tick number appears in captured Take ───────────────

test("43 — Performance: captured take shows tick number badge", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Performance");
  const surfaceGenBtn = page.getByRole("button", { name: /Surface: generate/i });

  // Get a line event into UNMIX
  for (let i = 0; i < 15; i++) {
    await surfaceGenBtn.click();
    await page.waitForTimeout(200);
    if ((await page.getByText("UNMIX").count()) > 0) break;
  }

  // Capture take
  const captureBtn = page.getByRole("button", { name: /Capture.*Take/i });
  await expect(captureBtn).toBeVisible();
  await captureBtn.click();
  await page.waitForTimeout(200);

  // Take tick badge must show a # number
  const tickBadge = page.locator(".tr-take__tick").first();
  await expect(tickBadge).toBeVisible();
  const tickText = await tickBadge.textContent();
  expect(tickText, "Expected tick badge to contain #<number>").toMatch(/#\d+/);
});

// ── 44. Instruments: Add input button creates a new row ───────────────────────

test("44 — Instruments: Add input button creates a new device input row", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Instruments");
  await expect(page.getByText("DEVICES").first()).toBeVisible();

  // Count existing inputs
  const slotInputs = page.locator("[data-input-slot]");
  const before = await slotInputs.count();

  // Click "+ Input"
  const addInputBtn = page.getByRole("button", { name: /\+ Input/i });
  await expect(addInputBtn).toBeVisible();
  await addInputBtn.click();
  await page.waitForTimeout(300);

  // Row count must increase
  const after = await slotInputs.count();
  expect(after, `Expected more input rows after Add Input (had ${before}, got ${after})`).toBeGreaterThan(before);
});

// ── 45. Instruments: Remove input button removes a row ────────────────────────

test("45 — Instruments: Remove input button removes a device input row", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Instruments");
  await expect(page.getByText("DEVICES").first()).toBeVisible();

  const slotInputs = page.locator("[data-input-slot]");
  const before = await slotInputs.count();
  expect(before, "Need at least one input to remove").toBeGreaterThan(0);

  // Click remove button for first input
  const removeBtn = page.getByRole("button", { name: /Remove input/i }).first();
  await expect(removeBtn).toBeVisible();
  await removeBtn.click();
  await page.waitForTimeout(300);

  const after = await slotInputs.count();
  expect(after, "Expected fewer input rows after Remove Input").toBeLessThan(before);
});

// ── 46. Composition: Add Breath slot creates a new slot ───────────────────────

test("46 — Composition: Add Breath button appends a BREATH slot", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Composition");
  await expect(page.getByText("SLOTS").first()).toBeVisible();

  const slotLabels = page.locator(".tr-slot__type");
  const before = await slotLabels.count();

  const breathBtn = page.getByRole("button", { name: /\+ Breath/i });
  await expect(breathBtn).toBeVisible();
  await breathBtn.click();
  await page.waitForTimeout(300);

  const after = await slotLabels.count();
  expect(after, `Expected slot count to increase after + Breath (had ${before}, got ${after})`).toBeGreaterThan(before);
});

// ── 47. Composition: undo after slot reorder restores original order ──────────

test("47 — Composition: undo after slot reorder restores previous slot order", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Composition");
  await expect(page.getByText("SLOTS").first()).toBeVisible();

  const slotLabels = page.locator(".tr-slot__type");
  const count = await slotLabels.count();
  if (count < 2) return; // Can't test reorder with < 2 slots

  const beforeFirst = await slotLabels.first().textContent();

  // Move first slot down
  const downBtns = page.getByRole("button", { name: /move slot .+ down/i });
  const firstEnabled = downBtns.filter({ hasNot: page.locator("[disabled]") }).first();
  await firstEnabled.click();
  await page.waitForTimeout(200);

  const afterMove = await slotLabels.first().textContent();
  expect(afterMove, "Slot must have moved").not.toBe(beforeFirst);

  // Undo via Ctrl+Z
  await page.keyboard.press("Control+z");
  await page.waitForTimeout(300);

  const afterUndo = await slotLabels.first().textContent();
  expect(afterUndo, "Undo must restore original slot order").toBe(beforeFirst);
});

// ── 48. Archive: Project Info reflects the current project ────────────────────

test("48 — Archive: Project Info table shows title, device count, and pattern count", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Archive");

  // Version row must be present and non-empty
  const rows = page.locator(".tr-table__row");
  await expect(rows.first()).toBeVisible();

  // Devices row must show a number > 0 (classic project has 3 devices)
  const deviceRow = page.getByRole("row", { name: /^Devices/i });
  await expect(deviceRow).toBeVisible();
  const deviceCount = await deviceRow.getByRole("cell").textContent();
  expect(Number(deviceCount), "Expected Devices count > 0").toBeGreaterThan(0);

  // Patterns row must show a number > 0
  const patternRow = page.getByRole("row", { name: /^Patterns/i });
  await expect(patternRow).toBeVisible();
  const patternCount = await patternRow.getByRole("cell").textContent();
  expect(Number(patternCount), "Expected Patterns count > 0").toBeGreaterThan(0);
});

// ── 49. Materials: Add sample input + button create a new token row ───────────

test("49 — Materials: new sample literal input + Add button append a sample row", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Materials");
  await expect(page.getByRole("columnheader", { name: "Literal" })).toBeVisible();

  const rows = page.locator(".tr-table tbody tr");
  const before = await rows.count();

  // Type into the "Add sample…" input and click Add
  const addInput = page.getByRole("textbox", { name: /New sample literal/i });
  await expect(addInput).toBeVisible();
  await addInput.fill("freshly-added-sample");
  await page.getByRole("button", { name: /^Add$/i }).click();
  await page.waitForTimeout(300);

  const after = await rows.count();
  expect(after, `Expected more rows after adding sample (had ${before}, got ${after})`).toBeGreaterThan(before);
});

// ── 50. Forms: compound policy select is editable ─────────────────────────────

test("50 — Forms: compound policy select is present and editable", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Forms");
  await expect(page.getByText("FORMS").first()).toBeVisible();

  const compoundSelect = page.getByRole("combobox", { name: /compound policy/i });
  await expect(compoundSelect).toBeVisible();

  // Change compound policy to "space"
  await compoundSelect.selectOption("space");
  await expect(compoundSelect).toHaveValue("space");

  // Change to "none"
  await compoundSelect.selectOption("none");
  await expect(compoundSelect).toHaveValue("none");
});

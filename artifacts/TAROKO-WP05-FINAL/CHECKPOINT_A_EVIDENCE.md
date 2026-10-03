# WP05 Human Checkpoint A — Evidence Index

**Branch**: `claude/v08-wp05-vertical-slice-recovery`  
**Date**: 2026-07-16  
**HEAD commit**: d9ba26e (docs: add v08 WP05 Checkpoint A entry to CHANGELOG)

---

## Gate Results

| Gate | Command | Result |
|------|---------|--------|
| v07 baseline | `./tests/run_all_tests.sh` | **534 passed, 0 failed** |
| v08 unit tests | `cd apps/workbench && npx vitest run` | **204 passed, 0 failed** |
| TypeScript | `tsc --noEmit` (inside build) | **0 errors** |
| Production build | `vite build` | **270.27 kB bundle, 0 errors** |
| E2E (Chromium) | `npx playwright test --project=chromium` | **38/38 passed** |
| axe-core a11y | `npx playwright test tests/e2e/a11y.spec.ts` | **8/8 panels, 0 serious/critical** |

---

## Feature Evidence

### 1. Sentinel Safety (`KEEP_UNCHANGED_SENTINEL = "__keep__"`)

- Stored in `project.forms.overrides[tokId][form]` only.
- `formToken()` in `packages/core/src/forms.ts` converts sentinel back to literal text in all code paths.
- 7 non-leak tests in `packages/core/src/__tests__/forms.test.ts` verify sentinel never appears in: plural, literal, thirdSingular, imperative, custom forms, or normal override paths.

### 2. Authoritative Import Receipt

- `importProjectWithReceipt(text, filename)` in `packages/core/src/export.ts`:
  - Detects format (json/html/unknown)
  - Captures pre-migration schema
  - Runs `migrateProject()` to get repaired project
  - Runs `validateProject()` to get truthful errors/warnings
  - Returns `{ project, receipt }` where receipt has 20+ fields including `errors`, `warnings`, `duplicateIdFindings`, `repairCount` — all from actual pipeline, never hardcoded
- 6 tests in `packages/core/src/__tests__/export.test.ts` cover: JSON import, HTML import, classicDefaultsApplied for legacy, errors for missing banks, throws on malformed JSON, migrationPath for legacy schema.
- `ArchivePanel.tsx` uses `importProjectWithReceipt()` and passes `fullReceipt` to Redux.
- `ImportReceiptBanner.tsx` renders all receipt fields.

### 3. Role-Aware Forms (MaterialsPanel + InstrumentsPanel)

ROLE_FORMS mapping (same in both panels):
- `noun` → literal, singular, plural
- `verb` → literal, thirdSingular, imperative
- `adjective` / `adverb` / `mixed` → literal only
- Unknown role → literal only (safe degradation)

### 4. Route Variable Palette (InstrumentsPanel)

- Quick-insert chips: one chip per `{slot:form}` combination shown inline below each route template
- "Insert variable…" button opens searchable `VariablePalette` dialog with keyboard nav (ArrowUp/Down/Enter/Escape)
- Insertion uses `ta.selectionStart` / `ta.selectionEnd` for caret-position insertion
- Chip `onClick` correctly separated from route selection by removing `role="button"` from outer route container

### 5. Accessibility Fixes

All `div[role="button"]` wrapping interactive children replaced:
- **InstrumentsPanel**: route header → `<button>` for name only; weight input and remove button are siblings
- **CompositionPanel**: scene row → `<button>` for name; chance input and toggle are siblings
- **AutomationPanel**: trigger row → `<button>` for name; enable/remove buttons and WHEN/THEN rows are siblings

### 6. Playwright Browser Fix

- Playwright 1.61.1 expects `chromium_headless_shell-1228` but only rev-1194 is installed.
- Symlink created: `/opt/pw-browsers/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell → .../1194/.../headless_shell`
- No download required; all 38 E2E tests run against Chromium 141.0.7390.37.

---

## E2E Journey (tests/e2e/checkpoint-a.spec.ts)

| # | Test | Result |
|---|------|--------|
| 1 | Shell loads at /next/ | ✓ |
| 2 | All 6 panels reachable via nav | ✓ |
| 3 | Materials: bank list + sample table | ✓ |
| 4 | Materials: Up/Down reorder buttons | ✓ |
| 5 | Instruments: route template editable | ✓ |
| 6 | Composition: slot Up/Down buttons | ✓ |
| 7 | Automation: WHEN→THEN format | ✓ |
| 8 | Performance: Cue does NOT write to Surface | ✓ |
| 9 | Performance: Surface separate Generate | ✓ |
| 10 | Performance: Surface Clear empties history | ✓ |
| 11 | Performance: Take capture workflow | ✓ |
| 12 | Archive: export buttons visible | ✓ |
| 13 | Archive: import section present | ✓ |
| 14 | Archive: malformed file shows error | ✓ |
| 15 | Transport controls present | ✓ |
| 16 | Inspector panel toggle | ✓ |
| 17 | v08 at /next/ survives reload | ✓ |
| 18 | a11y: h1, nav landmark, named buttons | ✓ |
| 19 | Focus-visible: tabbing moves focus | ✓ |
| 20 | Performance: Cue output after audition | ✓ |
| 21 | Materials: sample literal editable | ✓ |
| 22 | Materials: share column shows % | ✓ |
| 23 | Forms: case policy editable | ✓ |
| 24 | Forms: plural override editable | ✓ |
| 25 | Instruments: chip inserts {slot:form} | ✓ |
| 26 | Archive: import receipt banner appears | ✓ |
| 27 | Composition: slot Down reorder changes order | ✓ |
| 28 | Composition: Move to start/end functional | ✓ |
| 29 | Instruments: device input fields editable | ✓ |

---

## axe-core Audit (tests/e2e/a11y.spec.ts)

| Panel | serious/critical violations |
|-------|----------------------------|
| Shell | 0 |
| Materials | 0 |
| Forms | 0 |
| Instruments | 0 |
| Composition | 0 |
| Automation | 0 |
| Performance | 0 |
| Archive | 0 |

---

## Non-Blockers

- **Firefox/WebKit**: Not available in this environment. Playwright 1.61.1 only has Chromium 1194. Deferred to WP06.
- **Undo keyboard shortcut (Cmd+Z)**: Reducers exist; UI surface deferred to WP06.
- **WCAG 2.1 AA colour-contrast**: `--tr-dim` tokens need audit; deferred to WP06 visual pass.
- **Preview states (UNBUILT/FRESH/STALE/ERROR)**: v07 has this feature in `src/app.js`; v08 implementation deferred to WP06.
- **Autosave**: v07 has localStorage autosave; v08 implementation deferred to WP06.

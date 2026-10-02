# TAROKE REMIXER — Changelog

## 1.0.4 — 2026-10-02: corrected title spelling to TAROKE REMIXER; README intro

- Visible title spelling corrected from "RIMIXER" to "REMIXER" in the live app (`next2/index.html`: tab title, social/meta tags, brand mark, project metadata text), README, RIGHTS and the public docs. Earlier entries below keep their original wording as history.
- Visible version bumped from 1.0.3 to 1.0.4.
- Unchanged on purpose so saved work keeps loading: the autosave keys `taroke.rimixer.v1.draft` and `taroke.rimixer.v1.0.1.draft`, the `rimixerVersion` field in bundled project metadata, and all file names.
- README first screen rewritten for scholarly readers: byline, plain description in the *Taroko Gorge* lineage, citation line and rights pointer. Stale "Configure Pages" instruction removed.
- Repository hygiene: `.claude/settings.local.json`, `.claude/memory/session-log.md` and the v08 program zip are no longer tracked (kept locally, now in `.gitignore`).

## 00 · Intakes chamber added (2026-09-01)

App-native `00 · Intakes` chamber added to the live v1.0.3 app (`next2/index.html`), implementing design Alternative A (Intake Cabinet / Reading Desk) from the `TAROKE_REMIX_INTAKES_PRODUCT_QA_AUTHORITY` R2 authority.

- New `ORIGINS` navigator group with `00 · Intakes` before `01 · Source`; nav, mobile menu
  and `setChamber` are data-driven and pick it up automatically.
- Cabinet layout: sticky index list + reading-desk detail. `Ready to remix` (15 startable
  baselines) vs `Ecosystem` (all 35 records) scope; live search with Esc-to-clear.
- Each record shows *What this work does*, *In this intake* / *Outside this intake*, a
  typographic procedure score, and external access points (underlined link + `↗`).
- `Start from this intake` loads the bundled `.taroke.json` baseline through the existing
  `loadProjectText` path, names the project `"<work> — derivative"`, marks it unsaved, and
  routes to Source, which now renders a provenance receipt (`project.meta.intakeOrigin`).
  Unsaved current projects get a Save / Discard / Keep guard first. Built-in baselines are
  never mutated.
- Procedure record (`Argot Ogre, OK!`), embedded-witness, reference-only, and the
  baseline-pending `Grave-Machine — English` record expose no Start affordance.
- 15 historical Taroko baselines bundled inline (single-file-app parity); record copy
  curated from the handoff inventory. One corrupt character in a Camel Tail material
  literal (`U+FFFD`) removed.
- Verified headless: 49/49 DOM assertions (chamber render, Ready/Ecosystem, search,
  Start → Source receipt + derivative identity + unsaved state, reference-only/procedure
  record show no Start, dirty-project guard, all 15 baselines load, existing chambers
  unaffected), zero console errors; `node --check` passes on the app script.
- v07.8 root app, its source, and its 534-test CI suite are untouched.

---


## v1.0.3 promoted to root; v07.8 archived (2026-08-26)

- `/next2/` (v1.0.3 review candidate, five approved design repairs applied) promoted to the site
  root. It remains additionally available at `/next2/` as a stable mirror URL.
- v07.8 legacy app moved out of the live root and archived at `/archive/v07.8/`. Its source files
  (`index.html`, `styles.css`, `src/` at the repository root) and 534-test CI suite are unchanged.
- `.github/workflows/preview.yml` updated: root now builds from `next2/index.html`; v07.8 assembled
  into `_site/archive/v07.8/` instead of `_site/`.

---

## v08 WP05 — Human Checkpoint A (2026-07-16)

v08 workbench (React + Redux + Vite) vertical slice, branch `claude/v08-wp05-vertical-slice-recovery`.

- **Role-aware forms**: `KEEP_UNCHANGED_SENTINEL = "__keep__"` stored in `forms.overrides`; `formToken()` resolves sentinel back to literal text — sentinel never leaks into Cue, Surface, UNMIX, or exported HTML. 7 sentinel non-leak tests added.
- **Authoritative import receipt**: `importProjectWithReceipt()` runs actual `migrateProject()` + `validateProject()` and returns a truthful `ImportReceipt` (20+ fields). `ImportReceiptBanner` renders the full receipt; no hardcoded empty arrays.
- **Route variable palette**: searchable `VariablePalette` component with ArrowUp/Down/Enter/Escape keyboard nav, listbox semantics, and role-aware form chips that insert `{slot:form}` at the cursor caret.
- **Stable device input keys**: array-index key for input rows (not `inp.slot`) prevents remount on each keystroke.
- **a11y — nested-interactive eliminated**: removed `role="button"` from container divs that wrapped interactive controls in InstrumentsPanel, CompositionPanel, AutomationPanel. All replaced with proper `<button>` elements for selection intent.
- **Playwright browser symlink**: `chromium_headless_shell-1228` symlinked to pre-installed rev-1194 binary to resolve Playwright 1.61.1 revision mismatch without network download.
- **E2E suite**: 38 tests passing (smoke + 29-step checkpoint-a journey) on Chromium.
- **axe-core audit**: 8 panels audited; 0 serious/critical violations.
- v07 baseline: 534 passed, 0 failed (unchanged).
- v08 unit tests: 204 passed, 0 failed.

---

## v07.8 — Release checkpoint (2026-07-11)

Final release verification and checkpoint for the v07 track.

- Release metadata corrected: package version 0.7.8, document title neutral.
- Preview iframe preservation: Copy JSON / toast / dismiss-draft no longer recreate the running preview iframe. The iframe runtime continues uninterrupted across non-build Export rerenders. (`_previewBuildPending` + `_savedPreviewIframe` flag mechanism in `src/app.js`.)
- v07.8 iframe stability regression suite added to `tests/run_live_preview_cdp.py` (8 tests).
- Docs verifier extended with v07.8 metadata checks (6 checks) in `tests/run_docs_verification.py`.
- `docs/RELEASE_CHECKPOINT_v07_8.md` checkpoint document created.
- `KNOWN_LIMITS.md` and `EXPORT_PREVIEW_AND_RECOVERY.md` updated to reflect final preview recreation behavior.
- Branch: `claude/v07-8-release-checkpoint` → merged to main → tagged `v07.8-release-checkpoint`.

---

## v07.7 — Public documentation packet

Commit: `bd8a78e` / merge `e145603`

- Six public documentation files added: `WHAT_IS_TAROKE_RIMIXER.md`, `MAKE_A_REMIX.md`, `IMPORTING_AUTHORED_PROJECTS.md`, `EXPORT_PREVIEW_AND_RECOVERY.md`, `KNOWN_LIMITS.md`, `RELEASE_v07_7.md`.
- `tests/run_docs_verification.py` added: deterministic offline documentation verifier (105 checks).
- `tests/run_live_preview_cdp.py` added: live preview CDP test suite (68 tests).
- README rewritten as compact entry point with six-document index.
- Total after this pass: 520 passed, 0 failed.

---

## v07.6 — Live embedded artifact preview

Commit: `a5237bc` / merge `4dc6067`

- Export chamber shows sandboxed live preview of the standalone artifact.
- Explicit Build / Rebuild / Refresh / Retry lifecycle with state model: UNBUILT, FRESH, STALE, ERROR.
- Freshness signature detects project changes and marks preview STALE.
- Scroll and focus preserved across preview builds (`buildPreview()` captures/restores).
- Sandbox: `allow-scripts` only; no `allow-same-origin`.
- 68 CDP tests in `run_live_preview_cdp.py`.
- Total after this pass: 415 passed, 0 failed.

---

## v07.5e — Rendered-input trigger parity

Commit: `7a6f9d8` / certification `2b9ebd1`

- Triggers evaluate only against tokens consumed by the chosen route template, not all selected inputs.
- `consumedInputs` provenance added to each generated event.
- Exported standalone HTML uses the same consumed-input model as the editor.
- No RNG call when no consumed candidate matches the trigger condition.
- 16 CDP tests in `run_trigger_runtime_parity_cdp.py`.
- Total after this pass: 347 passed, 0 failed.

---

## v07.5d — Interaction continuity

Commit: `2bae9f2` / merge `444321e`

- Centralized chamber navigation resets work scroll to top; prior ad-hoc navigation removed.
- Same-step rerenders (`renderPreserving()`) preserve work scroll, rail scroll, stage scroll, focus, caret, and textarea scroll.
- Run stage follows new output when near bottom; manual scroll-up suspends auto-follow; returning to bottom resumes.
- Identity field changes update all live mirrors immediately via `updateLiveMirrors()` (no full render).
- 51 CDP tests in `run_interaction_continuity_cdp.py`.
- Total after this pass: 296 passed, 0 failed.

---

## v07.5c-r — Real Grave v3.2 import acceptance

Commit: `fb56819` / merge `57b6d5a`

- Import acceptance of real authored poem project: 33 banks, 270 tokens, 80 deterministic duplicate-ID occurrence repairs.
- No token loss. No classic-bank contamination. All authored bank IDs, order, labels, roles, and descriptions preserved.
- Evidence in `docs/GRAVE_V3_2_IMPORT_ACCEPTANCE.md` and `docs/screenshots/v07_5c_real_grave/`.

---

## v07.5c — Exact import fidelity

Commit: `eebc98d` / acceptance corrections `c3c47d8` / merge `15de175`

- Explicit `materials.trays` is authoritative over classic defaults.
- Legacy `dictionary` format migrates without classic-bank injection.
- Empty collections preserved as empty.
- Custom bank IDs, labels, roles, and descriptions survive import, JSON round-trip, HTML round-trip, and autosave/restore.
- `importRepairs` provenance recorded for all duplicate-ID repairs.
- Reference repair tests added (form overrides, note links, idempotent double-migrate).
- Total after this pass: 245 passed, 0 failed.

---

## v07.5 — Transparent local autosave recovery

Commit: `20c923c`

- Browser-local draft autosave after each edit (`taroke.remixer.v07.draft` localStorage key).
- Explicit restore prompt on next boot; recovery is never automatic.
- Corrupt or schema-mismatched drafts safely ignored.
- `localStorage` unavailability handled without crash.
- 19 CDP tests in `run_autosave_cdp.py`.

---

## v07.4 — Operations layer

Commit: `4ee5e05`

- Claude Code operations layer: `CLAUDE.md`, skill templates (`qa-evidence`, `release-check`, `feature-gate`), `docs/CLAUDE_WORKFLOW.md`.
- `.gitignore` for Python `__pycache__`.

---

## v07.3 — UX and accessibility hardening

Commit: `0ba8fe2` / merge `650640b`

- Focus management: chamber headings get focus on navigation; modal dialogs trap focus.
- ARIA roles and labels added: dialogs (`role="dialog"`, `aria-modal`, `aria-labelledby`), navigation, buttons, custom selects, status elements.
- Custom select keyboard support: Escape closes, Tab moves on.
- Status and toast announcements: `aria-live="polite"` for autosave status and flash toasts.
- Move-up / Move-down buttons for routes, slots, and scenes (alternatives to drag-and-drop).
- 28 CDP tests in `run_a11y_cdp.py`.

---

## v07.2 — Acceptance evidence

Commit: `fca53b8` / publish `f01e429`

- CDP browser test suites: `run_browser_functional_cdp.py`, `run_cdp_deep_qa.py`, `run_user_notes_regression_cdp.py`, `run_route_template_regression_cdp.py`.
- Self-test harness in `src/app.js`.
- Drag-and-drop handlers verified for tokens, routes, slots, scenes.
- Export HTML/import round-trip verified in browser.

---

## v07.1 — QA hardening

Commit: `caf4e51` / publish `a9930df`

- Deep static and runtime QA pass.
- `run_core_tests.js` (14 tests) and `run_core_extended_tests.js` (38 tests).
- `run_import_fidelity_tests.js` (35 tests).
- `run_trigger_compatibility_regression.js` (3 tests), `run_trigger_runtime_parity_tests.js` (32 tests).
- Doubled-punctuation cleanup for missing slot variables.
- Route template textarea + slot chip insertion.
- Route Move up / Move down buttons.

---

## v07 route-pass

Commit: `bdc8eda`

Initial functional workbench pass.

- Replaced cramped one-line route template input with large textarea.
- Clickable slot chips for route templates (`{slot:form}` variable insertion at cursor).
- Route Move up / Move down buttons; route ordering no longer depends on drag-and-drop.
- Changed draft storage key to avoid restoring broken prior local draft.
- Cleaned generated line text when a route references a missing slot (no doubled punctuation).
- Cleaned migrated note surfaces to remove doubled punctuation display artifacts.
- Improved device layout proportions.

### Kept from before v07

- Black/white pixel-like monospace interface.
- Editable sample banks, forms, devices, stanza patterns, flow, triggers, surface, run, notes, and export.
- Drag-and-drop for samples, routes, slots, and scenes where supported.
- JSON and standalone HTML export/import.

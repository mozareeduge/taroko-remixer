# TAROKO REMIXER v08 — Test Migration Ledger

**Model:** claude-sonnet-4-6  **Effort:** medium  
**Baseline:** 534 passed, 0 failed (16 suites, tag: v07.8-release-checkpoint)  
**Policy:** No test removed without explicit mapping and independent review. No test removed because it is inconvenient.

---

## Summary Table

| Suite | File | Count | v08 Status | Notes |
|-------|------|-------|------------|-------|
| Core/static | tests/run_core_tests.js | 14 | RETAINED | Pure JS, all behaviors ported to packages/core |
| Core extended | tests/run_core_extended_tests.js | 38 | RETAINED | Pure JS, ported to packages/core unit tests |
| Import fidelity (JS) | tests/run_import_fidelity_tests.js | 35 | RETAINED | Ported to packages/schema contract tests |
| Browser functional CDP | tests/run_browser_functional_cdp.py | 16 | ADAPTED | Replaced by Playwright Chromium equivalents in tests/e2e/ |
| User-notes regression | tests/run_user_notes_regression_cdp.py | 10 | ADAPTED | Replaced by Playwright: notes/recipe/inspector workflows |
| Route-template regression | tests/run_route_template_regression_cdp.py | 5 | ADAPTED | Replaced by Playwright: route palette + variable insertion |
| CDP deep QA | tests/run_cdp_deep_qa.py | 50 | ADAPTED | Split: component + Playwright Chromium |
| Accessibility/CDP | tests/run_a11y_cdp.py | 28 | ADAPTED | Replaced by axe + Playwright a11y suite |
| Autosave/recovery CDP | tests/run_autosave_cdp.py | 19 | ADAPTED | Replaced by store/command autosave tests + Playwright |
| Import fidelity CDP | tests/run_import_fidelity_cdp.py | 30 | ADAPTED | Replaced by Playwright import workflow + contract tests |
| Interaction continuity CDP | tests/run_interaction_continuity_cdp.py | 51 | ADAPTED | Replaced by Playwright: scroll/focus/caret continuity |
| Trigger compat (JS) | tests/run_trigger_compatibility_regression.js | 3 | RETAINED | Ported to packages/core trigger parity tests |
| Trigger runtime parity (JS) | tests/run_trigger_runtime_parity_tests.js | 32 | RETAINED | Ported to packages/core trigger unit tests |
| Trigger runtime parity CDP | tests/run_trigger_runtime_parity_cdp.py | 16 | ADAPTED | Replaced by Playwright: trigger runtime in editor |
| Live preview CDP | tests/run_live_preview_cdp.py | 76 | ADAPTED | Replaced by Playwright: export/preview/iframe stability |
| Documentation verification | tests/run_docs_verification.py | 111 | ADAPTED | Ported/extended in v08 docs verification suite |
| **TOTAL** | | **534** | | |

---

## Migration Status Legend

- **RETAINED**: Test moves to v08 unchanged or with minimal mechanical adaptation (import path, file location). Behavioral expectation identical.
- **ADAPTED**: Test is replaced by a named equivalent in a v08 test file. Behavioral coverage identical; implementation uses new framework (Playwright/Vitest/axe). Both old and new test must run simultaneously during transition.
- **REPLACED**: Test retired because the tested behavior no longer exists in v08, and the replacement covers the same contract from a different angle. Requires independent reviewer approval.
- **PENDING**: Not yet assigned; blocks WP gate.

---

## Detailed Mapping: Core/Static (14 tests → RETAINED)

**Original:** tests/run_core_tests.js  
**v08 target:** packages/core/src/__tests__/core-static.test.ts  
**Status:** PENDING (WP02)

| # | Description | v08 equivalent | Status |
|---|-------------|----------------|--------|
| 1 | boot files are modular and syntactically valid | static: tsc --noEmit on packages/core | PENDING |
| 2 | default project has required editable layers | unit: defaultProject() fields | PENDING |
| 3 | sample banks and token operations work | unit: bank/token CRUD functions | PENDING |
| 4 | forms handle plurals, verbs, locks, overrides | unit: forms module | PENDING |
| 5 | device edits affect generated output | unit: generator with device params | PENDING |
| 6 | stanza and flow produce event queue | unit: scheduler/expandStanza | PENDING |
| 7 | triggers can append text when condition matches | unit: trigger evaluation | PENDING |
| 8 | notes preserve event recipe links | unit: note/recipe provenance | PENDING |
| 9 | export/import HTML and JSON roundtrip | contract: round-trip fixture | PENDING |
| 10 | validation reports blocking errors | unit: validate() | PENDING |
| 11 | UI source contains handlers for all editable layers | static: TypeScript compilation covers all editables | PENDING |
| 12 | drag/drop handlers cover tokens, routes, slots, scenes | component: sortable list tests | PENDING |
| 13 | no native alert/prompt/confirm and no native select markup | static: ESLint rule | PENDING |
| 14 | self-test and debug hooks are present | unit: exposed test entry points | PENDING |

---

## Detailed Mapping: Core Extended (38 tests → RETAINED)

**Original:** tests/run_core_extended_tests.js  
**v08 target:** packages/core/src/__tests__/core-extended.test.ts  
**Status:** PENDING (WP02)

All 38 tests map directly to unit tests in packages/core. Key groups:
- sample_v07_reset import, migration, bankMeta round-trip (tests 1–4)
- cleanSurfaceText: doubled commas, leading punct, empty braces, multi-slot (tests 5–8)
- plural forms: -y→-ies, -s→-es, -fe→-ves, compound head, literal policies (tests 9–14)
- lockedLiteral behavior (tests 13–14)
- articleFor (test 15)
- weighted selection: zero-weight, all-zeros (tests 16–17)
- trigger modes: prepend, replace, chance=0, disabled (tests 18–21)
- validation errors/warnings (tests 22–26)
- exportProjectHtml: tick spans, unresolved slots, XSS safety (tests 27–29)
- export/import round-trip, trigger survival, downloadName (tests 30–32)
- activeScenes: disabled/chance=0 (tests 33–34)
- expandStanza: breath, chance=0, loop (tests 35–37)
- generateEvent: missing/disabled device (test 38)

---

## Detailed Mapping: Import Fidelity JS (35 tests → RETAINED)

**Original:** tests/run_import_fidelity_tests.js  
**v08 target:** packages/schema/src/__tests__/import-fidelity.test.ts  
**Status:** PENDING (WP02)

All 35 tests map to contract tests in packages/schema. Key invariants covered:
- custom trays: no classic injection, exact set preserved
- explicit empty collections preserved
- legacy dictionary migration
- bankMeta roles/labels survive
- tray key order exact
- duplicate ID repair: deterministic, idempotent, provenance stable
- JSON/HTML round-trips: exact custom tray set
- literal/weight/role survival
- device input references survive
- surface/family invariants
- classic defaults only when both trays and dictionary absent
- generation succeeds on custom project
- form override and note references survive duplicate repair

---

## Detailed Mapping: Browser Functional CDP (16 tests → ADAPTED)

**Original:** tests/run_browser_functional_cdp.py  
**v08 target:** tests/e2e/browser-functional.spec.ts (Playwright Chromium)  
**Status:** PENDING (WP05)

Each CDP test maps to a Playwright test with identical behavioral assertion:

| # | Description | Playwright equivalent |
|---|-------------|----------------------|
| 1 | app boots and renders controls | page.goto + expect controls visible |
| 2 | no loading fallback remains | expect loading-state not visible |
| 3 | sample add/edit updates model | click add → fill → assert updated |
| 4 | token drag/drop bank move works | dnd-kit drag + keyboard Move alternative |
| 5 | form override editable | fill form field → assert value |
| 6 | device name editable | fill device name → assert |
| 7 | route add/template editable | add route → fill template → assert |
| 8 | route drag/drop reorder works | keyboard Move alternative tested |
| 9 | stanza slot add works | click add slot → assert |
| 10 | slot drag/drop reorder works | keyboard Move alternative tested |
| 11 | flow scene add/edit works | add scene → name → assert |
| 12 | scene drag/drop reorder works | keyboard Move alternative tested |
| 13 | trigger add/edit works | add trigger → configure → assert |
| 14 | surface number editable | fill surface count → assert |
| 15 | run generates events | click Run → expect event output |
| 16 | export html/import works in browser | export → re-import → assert receipt |

---

## Detailed Mapping: Interaction Continuity CDP (51 tests → ADAPTED)

**Original:** tests/run_interaction_continuity_cdp.py  
**v08 target:** tests/e2e/interaction-continuity.spec.ts  
**Status:** PENDING (WP05)

Covers scroll ownership (A1–A8), chamber entry (B9–B18), same-step continuity (C20–C26), run continuity (D31–D39), reactive mirrors (E41–E48), focus (F53–F57), responsive (G57–G60). All 51 behavioral contracts are individually mapped.

This is one of the highest-value suites. Every behavior is a P1 requirement in v08. All must have Playwright equivalents before WP05 merges.

---

## Detailed Mapping: Live Preview CDP (76 tests → ADAPTED)

**Original:** tests/run_live_preview_cdp.py  
**v08 target:** tests/e2e/live-preview.spec.ts  
**Status:** PENDING (WP11)

Sections A–H (76 tests) map to Playwright tests. Section H (iframe stability, H69–H76) is especially critical and must map exactly.

---

## Detailed Mapping: Documentation Verification (111 tests → ADAPTED)

**Original:** tests/run_docs_verification.py  
**v08 target:** tests/compatibility/docs-verification.spec.ts  
**Status:** PENDING (WP01/WP12)

Tests verify doc existence, link validity, chamber labels, export action labels, autosave keys, preview state names, sandbox attributes, Grave counts, screenshots. v08 equivalents verify the same facts about v08 docs and v08 source files. Additionally retain v07 doc verification for the frozen root.

---

## Concurrent v07 Suite

The original 16 suites continue to run against the frozen v07 root throughout the rebuild. They are not replaced until WP13 cutover. The v08 suite is additive — it runs alongside, not instead of, the legacy suite during the rebuild.

---

## Test Removal Policy

No test may be removed from the v07 suite during the rebuild. No test may be removed from the v08 ledger without:

1. explicit justification recorded in this ledger
2. named equivalent covering the same behavioral contract
3. independent reviewer sign-off
4. recording in EVIDENCE_INDEX.md

---

*Last updated: WP00 initialization — 2026-07-13*

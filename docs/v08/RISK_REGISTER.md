# TAROKO REMIXER v08 — Risk Register

**Model:** claude-sonnet-4-6  **Effort:** medium

Risks are assessed at program level. Each WP may surface new risks; record them here immediately.

---

## Format

```
ID:          R-NNN
WP:          WP## (when identified)
Severity:    P0 | P1 | P2 | P3
Probability: high | medium | low
Status:      open | mitigated | resolved | accepted
Summary:     One sentence.
Consequence: What breaks if this triggers.
Mitigation:  What prevents or limits it.
Owner:       WP or role.
```

---

## R-001 — Schema divergence during TypeScript port

**WP:** WP02  
**Severity:** P0  
**Probability:** medium  
**Status:** open  
**Summary:** TypeScript type definitions in packages/schema may inadvertently change field names, optionality, or migration behavior relative to v07 core.js.  
**Consequence:** Imported v07 JSON/HTML would silently produce wrong data; Grave test would fail.  
**Mitigation:** Port schema from v07 core.js exactly. Write contract tests against versioned fixtures before any TypeScript model creation. Migration must be idempotent and produce identical output to v07 migration on all fixtures. Test migration ledger tracks every field.  
**Owner:** WP02 / compatibility-engineer

---

## R-002 — Immer patch undo/redo corrupts project state

**WP:** WP03  
**Severity:** P1  
**Probability:** low  
**Status:** open  
**Summary:** Immer inverse patches may not fully restore project state on undo, especially for complex operations like bulk merge or import.  
**Consequence:** Users lose work; stale state is silently applied.  
**Mitigation:** Command layer explicitly marks coalescing boundary. Import, delete, bulk merge, and route replacement are not coalesced. Undo tests cover all command types including edge cases (undo after import, undo after bulk).  
**Owner:** WP03 / state-architecture

---

## R-003 — v07 browser tests fail in v08 workspace environment

**WP:** WP01  
**Severity:** P1  
**Probability:** low  
**Status:** open  
**Summary:** Installing npm workspaces and new devDependencies may break the Chromium CDP environment used by v07 Python tests.  
**Consequence:** Baseline 534 count drops; baseline is no longer verified.  
**Mitigation:** v07 src/ is frozen. Install workspaces in a separate apps/ directory. Keep root package.json minimal. Run `./tests/run_all_tests.sh` after every WP merge.  
**Owner:** WP01 / toolchain

---

## R-004 — React hydration or Vite HMR interferes with autosave localStorage key

**WP:** WP03  
**Severity:** P1  
**Probability:** low  
**Status:** open  
**Summary:** v08 workbench may accidentally write to the v07 autosave key `taroke.remixer.v07.draft`, polluting v07 recovery.  
**Consequence:** Users restoring from autosave in v07 see v08-edited content; v07/v08 states corrupt each other.  
**Mitigation:** v08 uses a different localStorage key (e.g., `taroke.remixer.v08.draft`). Explicit test in v08 suite verifies no write to v07 key.  
**Owner:** WP03 / state-architecture

---

## R-005 — `/next/` GitHub Pages deploy fails or exposes v08 under root

**WP:** WP01/WP05  
**Severity:** P0  
**Probability:** low  
**Status:** open  
**Summary:** GitHub Actions misconfiguration could replace root deployment with `/next/` content.  
**Consequence:** v07 public root is destroyed before Checkpoint B acceptance.  
**Mitigation:** Separate deployment job for `/next/`. Root deployment job only runs on explicit cutover trigger. CI review before first `/next/` deploy. Rollback package ready.  
**Owner:** WP01 / archive-engineer

---

## R-006 — Grave fixture acceptance counts wrong in v08 import receipt

**WP:** WP02/WP11  
**Severity:** P0  
**Probability:** medium  
**Status:** open  
**Summary:** v08 import receipt may report different counts (trays, tokens, repairs) than the v07 accepted evidence (33 trays, 270 tokens, 80 repairs).  
**Consequence:** Compatibility contract violation; real Grave import fails acceptance.  
**Mitigation:** Port migration and repair logic exactly. Contract test loads Grave fixture and asserts exact counts before any WP05 deployment. Compatibility gate skill enforces this.  
**Owner:** WP02 / compatibility-engineer

---

## R-007 — Playwright cross-browser failures block hardening

**WP:** WP12  
**Severity:** P1  
**Probability:** medium  
**Status:** open  
**Summary:** Firefox or WebKit may exhibit interaction failures (popover dismiss, keyboard reorder, mobile sheets) not caught on Chromium.  
**Consequence:** WP12 hardening blocked; Checkpoint B delayed.  
**Mitigation:** Run Playwright across all three browsers from WP05 onward. Identify cross-browser issues early. React Aria Components and dnd-kit both have broad browser coverage.  
**Owner:** WP12 / test-architect

---

## R-008 — Design contradiction between authored documents blocks implementation

**WP:** any  
**Severity:** P1  
**Probability:** low  
**Status:** open  
**Summary:** A genuine contradiction between two program documents may block faithful implementation.  
**Consequence:** Program stops until Mohammad resolves the conflict.  
**Mitigation:** Document contradiction in DESIGN_CONFLICTS.md with evidence and alternatives immediately. Do not quietly resolve delicate ambiguity. Stop only if the conflict prevents further safe progress.  
**Owner:** Program Lead

---

## R-009 — Context window exhaustion mid-WP

**WP:** any  
**Severity:** P2  
**Probability:** medium  
**Status:** open  
**Summary:** A single-session WP execution may exhaust available context before completing the WP gate.  
**Consequence:** Incomplete implementation or tests; partial state committed.  
**Mitigation:** STATUS.md allows fresh session to resume. Each WP uses focused isolated worktrees. Commits at each logical checkpoint within a WP, not only at the end. Never commit partial/broken code.  
**Owner:** Program Lead

---

*Last updated: WP00 initialization — 2026-07-13*

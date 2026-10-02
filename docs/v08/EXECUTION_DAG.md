# TAROKO REMIXER v08 — Execution DAG

**Model:** claude-sonnet-4-6  **Effort:** medium  
**Baseline:** 534 passed, 0 failed (tag: v07.8-release-checkpoint / f7183f01)  
**Program authority:** `docs/v08/program/` — immutable design specification

---

## Work Package Graph

```
WP00 ──► WP01 ──► WP02 ──► WP03 ──┐
                                   ├──► WP05 ──► [Checkpoint A] ──► WP06..WP11
                              WP04 ┘                                      │
                                                                      WP12 ──► [Checkpoint B] ──► WP13
```

**Sequential dependencies (must not overlap):**

- WP00 must complete before any other WP starts
- WP01 must complete before WP02
- WP02 must complete before WP03
- WP03 + WP04 must both complete before WP05
- WP05 + Checkpoint A before WP06–WP11
- WP06–WP11 may proceed in parallel within ownership rules
- WP12 after WP06–WP11
- WP13 after Checkpoint B acceptance

**Concurrent ownership constraints:**
- Core schema: one owner at a time (WP02 owns until merged)
- Root Redux store: one owner at a time (WP03 owns until merged)
- Global CSS tokens: one owner at a time (WP04 owns until merged)
- Root `/`: read-only until WP13

---

## Work Packages

### WP00 — Program Bootstrap
**Branch:** `claude/v08-wp00-program-bootstrap`  
**Scope:** Control docs, claude assets, baseline inventory, CI foundations, execution-policy corrections. No functional change.  
**Gate:** 534 pass; v07 root unchanged; model policy Sonnet 4.6/medium; control docs complete; agent defs validated; test ledger established; independent review; PR merged.

### WP01 — Workspace and Toolchain
**Branch:** `claude/v08-wp01-toolchain`  
**Scope:** React+TS+Vite setup, npm workspaces layout, packages/core packages/schema packages/artifact-runtime packages/ui packages/fixtures, Storybook, Vitest, Playwright, CI skeleton, blank `/next/`.  
**Gate:** CI green; blank `/next/` deploys; v07 root unchanged; 534 pass.

### WP02 — Core and Schema Boundary
**Branch:** `claude/v08-wp02-core-schema`  
**Scope:** Typed models in packages/schema, packages/core TS adapter/port of v07 core.js, migration adapters, import receipt, unknown-field preservation, deterministic RNG parity, contract tests.  
**Gate:** Core unit + property + contract tests pass; generation parity vs v07; 534 legacy pass.

### WP03 — State, Commands, Undo, Autosave
**Branch:** `claude/v08-wp03-state`  
**Scope:** Redux Toolkit store, typed command layer, Immer patches, undo/redo, selection state, autosave, preview freshness, runtime state.  
**Gate:** Store/command tests, undo tests, autosave tests; 534 legacy pass.

### WP04 — UI Foundation and Shell
**Branch:** `claude/v08-wp04-ui-shell`  
**Scope:** CSS tokens, primitive components (Button/fields/select/popover/dialog/collection/sortable), Transport, grouped Navigator, Workspace, Inspector split, mobile sheets, Storybook stories.  
**Gate:** Storybook deploys; accessibility checks pass; responsive checks pass; 534 legacy pass.

### WP05 — Complete Vertical Slice
**Branch:** `claude/v08-wp05-vertical-slice`  
**Scope:** Full authored journey: import → receipt → bank/sample → sample edit → relative weight → role-aware form → device input → route variable insertion → pattern → scene → WHEN→THEN trigger → Cue → Surface → Unmix Line → Take → JSON export → standalone HTML → preview → autosave restore. Deploy to `/next/`.  
**Gate:** Canonical journey exercisable end-to-end; design conformance check; Checkpoint A packet prepared; human review.

### WP06 — Materials
**Branch:** `claude/v08-wp06-materials`  
**Scope:** Full Banks/Samples, bulk paste preview, merge/sort, expected share/activity, role-aware Forms, delete/reroute.

### WP07 — Instruments
**Branch:** `claude/v08-wp07-instruments`  
**Scope:** Devices/inputs/routes, route palette, validation, Cue.

### WP08 — Composition
**Branch:** `claude/v08-wp08-composition`  
**Scope:** Pattern Matrix, Flow Score, accessible reorder (pointer/touch/keyboard/Move), current scheduler semantics.

### WP09 — Automation
**Branch:** `claude/v08-wp09-automation`  
**Scope:** WHEN→THEN trigger editor, parity, provenance.

### WP10 — Performance (Cue/Surface/Monitor/Unmix/Takes)
**Branch:** `claude/v08-wp10-performance`  
**Scope:** Cue, Surface follow policy, Monitor, Unmix Line, Takes.

### WP11 — Archive
**Branch:** `claude/v08-wp11-archive`  
**Scope:** Import receipt UI, JSON/HTML export, autosave/recovery, preview, error handling.

### WP12 — Hardening
**Branch:** `claude/v08-wp12-hardening`  
**Scope:** Cross-browser, a11y, performance, security, visual regression, docs, all legacy test mappings. Checkpoint B packet.

### WP13 — Cutover
**Branch:** `claude/v08-wp13-cutover`  
**Scope:** Archive v07 under `/legacy/v07/`, replace root with v08, live smoke, rollback verification, release tag `v08.0-editor-rebuild`.

---

## File Ownership

| File / Package          | Owner WP  | Concurrent lock |
|-------------------------|-----------|-----------------|
| packages/schema/        | WP02      | exclusive until merged |
| packages/core/          | WP02      | exclusive until merged |
| packages/artifact-runtime/ | WP02   | exclusive until merged |
| apps/workbench/store/   | WP03      | exclusive until merged |
| packages/ui/ tokens     | WP04      | exclusive until merged |
| src/ (v07 root)         | FROZEN    | read-only throughout |
| index.html (root)       | FROZEN    | read-only until WP13 |
| docs/v08/STATUS.md      | Lead      | updated after each WP |

---

## Human Checkpoints

| Checkpoint | After  | Required before |
|------------|--------|-----------------|
| A          | WP05   | WP06 start      |
| B          | WP12   | WP13 start      |

Stop completely at each checkpoint. Do not start next phase until Mohammad returns verdict.

---

*Last updated: WP00 initialization*

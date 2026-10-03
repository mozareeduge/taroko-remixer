> **Historical record** — This file documents the completed v08 program through PR #16. It is not an executable instruction. Future work arrives only through a separately compiled Project Relay workload.

# TAROKO REMIXER v08 — Program Status

**Model:** claude-sonnet-4-6  **Effort:** medium  
**Design authority:** `docs/v08/program/` — immutable; do not modify during implementation  
**Baseline commit:** f7183f01037bf963612d4b56561d3b8cdde306b5 (tag: v07.8-release-checkpoint)  
**Accepted baseline:** 534 passed, 0 failed

---

## Quick Resume

A fresh claude-sonnet-4-6 / medium session resuming this program must:

1. Read `relay-workload-package/START_HERE.md` and `MISSION.md`
2. Read this STATUS.md and `docs/v08/control/RUN_STATE.json`
3. Inspect live repo: branches, PRs, CI, Pages deployment
4. Reuse every valid success; never repeat a successful irreversible action
5. Continue from the recorded `active_task` in RUN_STATE.json

---

## Work Package Status

| WP   | Name                             | Branch                                    | Status              | Tests | PR   | Commit     |
|------|----------------------------------|-------------------------------------------|---------------------|-------|------|------------|
| WP00 | Program Bootstrap                | claude/v08-wp00-program-bootstrap         | MERGED (#4)         | 534   | #4   | c6589e3    |
| WP01 | Workspace/Toolchain (recovery)   | claude/v08-wp01-toolchain-recovery        | MERGED (#10)        | 534   | #10  | be91655    |
| WP02 | Core/Schema Boundary (recovery)  | claude/v08-wp02-core-schema-recovery      | MERGED (#11)        | 534   | #11  | 735bcaa    |
| WP03 | State/Commands/Undo (recovery)   | claude/v08-wp03-state-commands-recovery   | MERGED (#12+#13)    | 152   | #12+#13 | 539c0fa |
| WP04 | UI Foundation/Shell (recovery)   | claude/v08-wp04-ui-shell-recovery         | MERGED (#14)        | 152   | #14  | 5a64cef    |
| WP05 | Vertical Slice (recovery)        | claude/v08-wp05-vertical-slice-recovery   | MERGED (#15)        | 206   | #15  | a781bf9    |
| [A]  | Human Checkpoint A               | —                                         | APPROVED_WITH_CONDITIONS | — | — | eb7b2fd  |
| WP06–12 | Experience Pass (combined)  | claude/taroke-remixer-reconcile-tydcn5    | ACTIVE              | —     | pending | — |
| [B]  | Human Checkpoint B               | —                                         | PENDING             | —     | —    | —          |
| WP13 | Cutover                          | claude/v08-wp13-cutover                   | NOT STARTED         | —     | —    | —          |

---

## Current Focus

**WP06–WP12 Experience Pass** — active on branch `claude/taroke-remixer-reconcile-tydcn5`.

WP05 merged 2026-07-16 via PR #15 (merge commit `0a2a71c`). Human Checkpoint A approved with conditions: visual appearance, mobile composition, density/hierarchy, and Surface aesthetics must be addressed before Checkpoint B.

This phase delivers the full UI/UX, visual, responsive, affordance, accessibility, and sensory refinement pass against the GPT-authored workload `TAROKO_Relay_WP05_Closure_and_WP06_12_Experience_v1.0`.

**Functional freeze**: The merged WP05 behavior is the feature boundary. No new product functionality.

WP06–WP12 screen-area scopes are unified into one cumulative Draft PR. Tasks T01–T10 execute automatically to Checkpoint B.

---

## WP06–12 Task Status

| Task | Description                                  | Status   |
|------|----------------------------------------------|----------|
| T00  | Audit + WP05 post-merge closure              | COMPLETE |
| T01  | Experience branch + visual baseline          | COMPLETE |
| T02  | Global visual system, shell, mobile          | ACTIVE   |
| T03  | Materials and Forms refinement               | PENDING  |
| T04  | Devices and Routes refinement                | PENDING  |
| T05  | Composition refinement                       | PENDING  |
| T06  | Automation refinement                        | PENDING  |
| T07  | Performance (Cue/Surface) refinement         | PENDING  |
| T08  | Archive refinement                           | PENDING  |
| T09  | Cross-browser hardening, visual regression   | PENDING  |
| T10  | Freeze, reviews, deploy /next/, Checkpoint B | PENDING  |

---

## Deployment State

| Location       | Content        | Status                                         |
|----------------|----------------|------------------------------------------------|
| `/`            | v07.8 (frozen) | Live                                           |
| `/next/`       | v08 WP05       | Live (deployed 2026-07-16 run 29539529622)     |
| `/legacy/v07/` | —              | Empty until WP13                               |

---

## v07 Baseline Evidence

- v07 baseline: 534 passed, 0 failed (CI run 29530118934, candidate a781bf9)
- v08 unit/component: 206 passed, 0 failed (CI run 29530118934)
- TypeScript: 0 errors
- E2E: Firefox ✓, Chromium ✓, WebKit ✓, Mobile ✓ (CI run 29530118934)

---

## Stop Conditions

Stop the program (not just the current WP) for:

1. baseline failure that cannot be responsibly resolved
2. schema incompatibility requiring product-level change
3. real Grave data loss
4. editor/artifact semantic divergence
5. contradiction between binding design specifications blocking implementation
6. inability to preserve v07 root
7. security issue

Ordinary defects, layout issues, and test failures: diagnose and fix; do not stop.

---

*Last updated: 2026-07-17 — T01 complete (CSS bundle, shell grid, 208 tests); T02 active (shell/mobile refinements)*

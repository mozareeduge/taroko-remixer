# TAROKO REMIXER v08 — Evidence Index

**Model:** claude-sonnet-4-6  **Effort:** medium

Per-WP evidence records. Updated after each WP merges.

---

## Format

```
WP:       WP##
Branch:   claude/v08-wp##-name
Commit:   <sha>
PR:       #NNN
Merged:   YYYY-MM-DD
Tests:    NNN passed, 0 failed (suites listed)
Visual:   screenshot paths
A11y:     summary
Perf:     summary
Security: summary
Compat:   summary
Reviewer: who reviewed
Findings: list of findings and dispositions
Non-blockers: list
Rollback: how to revert
```

---

## WP00 — Program Bootstrap

**Branch:** claude/v08-wp00-program-bootstrap  
**Status:** IN PROGRESS  

**Commit:** c1d8855 (latest; adds verifier + corrects reviewer classification)  
**Tests:** 534 passed, 0 failed (all 16 v07 suites — 14+38+35+16+10+5+50+28+19+30+51+3+32+16+76+111)  
**Verifier:** `python3 scripts/verify_v07_baseline.py` (deterministic; parses per-suite counts; fails on any mismatch)  

**Independent Review — classification (corrected 2026-07-13):**  
The "independent reviewer" recorded in commit 8bd5acf was an intra-session Claude sub-agent spawned from the same session that authored WP00. This constitutes a same-session self-review, not an external or genuinely fresh-context review. The recovery audit (branch `claude/taroko-v08-recovery-audit-ajf7b3`, commit `d37a64b`) documents this classification. The gate condition `[x] independent reviewer approved` below reflects that the review was performed, but the reviewer classification has been downgraded to **intra-session sub-agent**.

A fresh-context independent review (separate session, no prior exposure to this conversation) is required before PR #4 can be marked ready for merge. See recovery audit doc §6 for the review protocol.

**Gate conditions:**
- [x] 534 tests pass (verified serially via `scripts/verify_v07_baseline.py` on this branch)
- [x] v07 root unchanged (src/, index.html, styles.css, tests/, package.json not in diff)
- [x] model policy: claude-sonnet-4-6 / medium throughout
- [x] program design authority unchanged (only execution-policy language corrected)
- [x] all 7 control documents created
- [x] all 6 agent definitions validated (model + effort pinned)
- [x] hooks validated and installed
- [x] test ledger established (534 tests across 16 suites mapped)
- [x] intra-session sub-agent review completed (no P0/P1 findings)
- [ ] **fresh-context independent review** (separate session) — REQUIRED before merge
- [ ] PR merged (pending)
- [ ] STATUS updated post-merge

---

## WP05 — Vertical Slice / Human Checkpoint A (candidate)

**Branch:** claude/v08-wp05-vertical-slice-recovery  
**Status:** AWAITING REVIEW (PR #15 → main)  
**Commit:** a781bf9 (2026-07-16)

**CI evidence (a781bf9):**
- PR run 29530118934: all 8 jobs green (TypeScript, v07 baseline 534, unit tests Vitest, build /next/, E2E Firefox/Chromium/WebKit/Mobile)
- Push run 29530114283: success

**Tests:**
- v07 baseline: 534 passed, 0 failed (CI-verified)
- v08 unit/component: 206 passed, 0 failed (9 test files, CI-verified)
- TypeScript: 0 errors (CI-verified)
- Build: → /next/ (CI-verified)
- E2E: Firefox ✓, Chromium ✓, WebKit ✓, Mobile (Chromium portrait + WebKit) ✓ (CI-verified)

**Features delivered (WP05 complete):**
- F-ID: Stable DeviceInput IDs — schema `id: string`, migration assigns UIDs, commands use id as key
- F-AUTOSAVE/F-STORAGE: Real v08 autosave writer, corrupt/quota storage handling
- F-PREVIEW/F-PREVIEW-SANDBOX: Archive preview lifecycle (UNBUILT/FRESH/STALE/ERROR); sandbox isolation
- F-JSON/F-HTML: JSON download inspection + round-trip; standalone HTML runtime parity
- F-JOURNEY: 50-step authored E2E journey
- F-CHROMIUM/F-FIREFOX/F-WEBKIT/F-MOBILE: Cross-browser CI gates
- F-A11Y: axe-core a11y gate; scope attributes; accessible names throughout
- F-REORDER-PTR/F-REORDER-KBD/F-REORDER-HISTORY: Pointer drag, keyboard pickup, undo/redo
- F-REF: Slot rename cascades `{slot:name}` in route templates; delete removes stale refs (CI-verified cb9848c)
- F-REORDER-TOUCH: Touch drag-and-drop via touchstart/touchmove/touchend + native passive:false listener + dedicated onTouchCancel (CI-verified a781bf9)
- F-V07-DRAFT: Non-destructive v07 draft migration banner — reads v07 key without deleting it (CI-verified a2e3de5)

**Independent review (7e95556 — final candidate):**
- Round 1 (a2e3de5): 2 BLOCKED (P1: onTouchCancel missing; P1: passive touchmove); 1 APPROVED. Fixes applied in 7e95556.
- Round 2 (7e95556): pending (3 fresh reviewers running)

**Gate conditions:**
- [x] v07 534 baseline unchanged (CI run 29529359485)
- [x] 206 v08 unit tests pass (CI run 29529359485)
- [x] TypeScript clean (CI run 29529359485)
- [x] Build produces /next/ artifact (CI run 29529359485)
- [x] 50-test E2E journey authored
- [x] Cross-browser CI green: Firefox/WebKit/Mobile (CI run 29529359485)
- [x] Archive preview lifecycle implemented
- [x] DraftRecoveryBanner with explicit user action (no silent restore)
- [x] Multimodal reorder (pointer drag + touch + keyboard pickup)
- [x] F-REF: slot rename/delete ref cascade (CI-verified)
- [x] F-V07-DRAFT: non-destructive v07 migration (CI-verified)
- [x] F-FREEZE: candidate 7e95556 frozen with all CI green
- [x] F-REVIEW: 3 fresh reviews no P0/P1 — Round 3 (a781bf9) APPROVED×3
- [x] F-DEPLOY: public root and /next/ deployed — workflow run 29539529622, all steps green, 2026-07-16T22:26:51Z
- [x] Human Checkpoint A verdict from Mohammad — APPROVED_WITH_CONDITIONS 2026-07-16
- [ ] PR #15 merged

---

*Later WPs will be recorded here as they merge.*

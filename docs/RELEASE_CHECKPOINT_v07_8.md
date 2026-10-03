# Release Checkpoint — v07.8

> **Historical document.** This page describes the v07.x legacy editor (frozen at v07.8, archived at https://taroke-remixer.theblackbirdfield.com/archive/v07.8/), not the current app. Chamber names, file behaviour and URLs here may differ from TAROKO REMIXER v1.0.4. For the current app see the [README](../README.md) and [What Is TAROKO REMIXER?](WHAT_IS_TAROKO_REMIXER.md).

Date: 2026-07-11
Branch: claude/v07-8-release-checkpoint
Base commit: e145603 (Merge v07.7 public documentation packet branch)

---

## Summary

v07.8 is a release-verification pass. No new user-visible features were added.
Changes correct demonstrated release blockers, stale metadata, and absent evidence.

---

## Changes in this pass

### Release blocker (Phase 10) — Preview iframe preservation

**Problem:** `render()` replaces `app.innerHTML`, destroying every DOM child including
the live preview iframe. `flash()` (called by Copy JSON, toast, etc.) triggers
`renderPreserving()` → `render()`, which destroyed and recreated the iframe with a new
`srcdoc` assignment — reloading the sandboxed runtime on every non-build render.

**Fix (src/app.js):** Two module-level flags (`_previewBuildPending`, `_savedPreviewIframe`)
allow `render()` to save the running iframe node before the innerHTML replacement and restore
it in place of the new placeholder immediately after — within the same synchronous execution.
When `buildPreview()` sets `_previewBuildPending = true`, the save/restore path is bypassed
so the new `srcdoc` is assigned normally. The `srcdoc` assignment in `bind()` is guarded to
skip when the save is active.

### Stale release metadata (Phase 3 audit)

| Item | Before | After |
|------|--------|-------|
| `<title>` in index.html | `TAROKO REMIXER v07 reset` | `TAROKO REMIXER` |
| package.json version | `0.7.0-layout-pass` | `0.7.8` |
| CHANGELOG.md | Covered only v07 route-pass | Full cumulative changelog v07–v07.8 |
| docs/RELEASE_v07_7.md | Deferred count to TEST_REPORT | Added: "520 passed, 0 failed" explicitly |

### Missing evidence (Phase 5 audit)

Two v07.5d screenshots were absent:
- `docs/screenshots/v07_5d/desktop-long-custom-bank-list.png` — captured via CDP
- `docs/screenshots/v07_5d/mobile-844x390-export-entry.png` — captured via CDP

### Documentation corrections

- **docs/KNOWN_LIMITS.md** — Preview recreation description updated to reflect the
  implemented fix: non-project actions (Copy JSON, toast, autosave strip) do not recreate
  the iframe.
- **docs/EXPORT_PREVIEW_AND_RECOVERY.md** — Recreation note updated to match the fix.
- **docs/CLAUDE_WORKFLOW.md** — Release train updated: v07.7 entry records merge commit;
  v07.8 entry records completed release verification.

### New tests (Phase 10 regression contract)

**tests/run_live_preview_cdp.py — Section H (8 tests, H69–H76):**

| Test | What it verifies |
|------|-----------------|
| H69 | Copy JSON does not replace the running preview iframe |
| H70 | Toast expiry does not replace preview iframe |
| H71 | Generated preview content survives Copy JSON + toast cycle |
| H72 | Dismiss-draft does not recreate preview iframe |
| H73 | Multiple non-build renders preserve iframe node identity |
| H74 | Explicit Rebuild replaces iframe (correct behavior preserved) |
| H75 | Preview srcdoc preserved in state after nav away/back |
| H76 | New project resets preview to unbuilt (deliberate recreation) |

**tests/run_docs_verification.py — Section 25 (6 tests):**

| Test | What it verifies |
|------|-----------------|
| 25-1 | package.json version is 0.7.8 |
| 25-2 | index.html title does not contain stale 'reset' label |
| 25-3 | README references v07.8 |
| 25-4 | CHANGELOG.md has v07.8 section |
| 25-5 | RELEASE_v07_7.md states historical count 520 passed, 0 failed |
| 25-6 | screenshot dir exists: docs/screenshots/v07_8 |

### v07.8 screenshots (docs/screenshots/v07_8/)

- desktop-release-source.png
- desktop-long-custom-bank-list.png
- desktop-run.png
- desktop-export-preview-fresh.png
- desktop-export-preview-stale.png
- mobile-375-run.png
- mobile-375-export.png
- mobile-844x390-export.png

---

## Test suite

Command: `./tests/run_all_tests.sh`

```
534 passed, 0 failed (16 suites)
```

Suite breakdown:

| Suite | Count |
|-------|-------|
| Core/static | 14 |
| Core extended | 38 |
| Import fidelity (JS) | 35 |
| Browser functional CDP | 16 |
| User-notes regression | 10 |
| Route-template regression | 5 |
| CDP deep QA | 50 |
| Accessibility/CDP hardening | 28 |
| Autosave/recovery CDP | 19 |
| Import fidelity CDP | 30 |
| Interaction continuity CDP | 51 |
| Trigger compatibility regression | 3 |
| Trigger runtime parity (JS) | 32 |
| Trigger runtime parity CDP | 16 |
| Live preview CDP | 76 |
| Documentation verification | 111 |
| **Total** | **534** |

v07.7 historical total: 520 passed, 0 failed.

---

## Local browser check

PASS — App boots without console errors. All chambers reachable. Run generates
events. Export produces downloadable .taroke.html. Autosave and recovery work.
Preview iframe survives Copy JSON and toast without recreation.

## Live URL check

BLOCKED (network policy). Local check passed.

## No-redesign check

PASS — Background is black/white monospace workbench. No surface theme cards.
No visible line numbers in run or export surfaces.

---

## Verdict

PASS — ready to merge and tag.

# Release Notes — v07.7 Public Documentation Packet

> **Historical document.** This page describes the v07.x legacy editor (frozen at v07.8, archived at https://taroke-remixer.theblackbirdfield.com/archive/v07.8/), not the current app. Chamber names, file behaviour and URLs here may differ from TAROKO REMIXER v1.0.4. For the current app see the [README](../README.md) and [What Is TAROKO REMIXER?](WHAT_IS_TAROKO_REMIXER.md).

**Status:** release candidate — documentation and verification pass only. No application behavior changed.

---

## Description

v07.7 is the public documentation pass for TAROKO REMIXER. It introduces the public-facing documentation packet, a documentation verification script, and a recrafted README. No source files, generator logic, or test behavior were modified.

---

## Implemented in this pass

- `docs/WHAT_IS_TAROKO_REMIXER_KEEP.md` — conceptual overview and scope definition.
- `docs/MAKE_A_REMIX.md` — practical chamber-by-chamber usage guide.
- `docs/IMPORTING_AUTHORED_PROJECTS.md` — import contract, fidelity rules, format support.
- `docs/EXPORT_PREVIEW_AND_RECOVERY.md` — JSON, standalone HTML, autosave, live preview, sandboxing.
- `docs/KNOWN_LIMITS.md` — architecture, browser, import, interaction, accessibility, preview, and aesthetic limits.
- `docs/RELEASE_v07_7.md` — this file.
- `tests/run_docs_verification.py` — offline, deterministic documentation verifier (Python standard library only).
- Updated `README.md` — compact entry point with six-document index.
- Updated `TEST_REPORT.md` — documentation verification suite added to total.
- Updated `CLAUDE.md` — expected test total updated.
- Updated `docs/CLAUDE_WORKFLOW.md` — release train updated with v07.7 merge.

---

## Executable test count

After adding the documentation verifier to the suite:

**520 passed, 0 failed** (all 16 suites, verified 2026-07-11)

This is the historical v07.7 total. v07.8 adds further tests; see `TEST_REPORT.md` for the current suite total.

---

## Public repository

`https://github.com/mozareeduge/taroke-remixer`

## Live Pages URL

`https://mozareeduge.github.io/taroke-remixer/`

---

## Feature summaries from previous passes

### Real Grave v3.2 import acceptance (v07.5c-r)

Verified import of a real authored poem project with 33 banks, 270 tokens, and 80 deterministic duplicate-ID occurrence repairs. No token loss. No classic-bank contamination. All authored bank IDs, order, labels, roles, and descriptions preserved exactly.

See `docs/GRAVE_V3_2_IMPORT_ACCEPTANCE.md` for detailed evidence.

### Import fidelity contract (v07.5c)

Explicit `materials.trays` is authoritative over classic defaults. Legacy `dictionary` format migrates without classic-bank injection. Empty collections are preserved as empty. Custom bank IDs, labels, roles, and descriptions survive import, JSON round-trip, HTML round-trip, and autosave/restore.

See `docs/IMPORT_FIDELITY_v07_5c.md` for full contract and evidence.

### Interaction continuity (v07.5d)

Centralized chamber navigation resets work scroll to top. Same-step rerenders preserve scroll positions, focus, caret position, and textarea scroll. Run stage follows new output when near the bottom; user scroll-up suspends auto-follow. Identity field changes update all live mirrors immediately without a chamber change.

See `docs/INTERACTION_CONTINUITY_v07_5d.md` for architecture and test evidence.

### Rendered-input trigger parity (v07.5e)

Triggers only evaluate against samples that were consumed by the chosen route template — not against all selected inputs. Exported standalone HTML files evaluate triggers using the same consumed-input model as the editor. No RNG call is made when no consumed candidate matches the trigger condition.

See `docs/TRIGGER_RUNTIME_PARITY_v07_5e.md` for model description and test evidence.

### Live embedded artifact preview (v07.6)

Export chamber shows an embedded sandboxed preview of the standalone artifact. Explicit Build / Rebuild / Refresh / Retry lifecycle. State model: UNBUILT, FRESH, STALE, ERROR. Export actions (Save HTML, Export JSON, Copy JSON) appear above the preview. Freshness signature detects project changes. Scroll and focus are preserved across preview builds.

See `docs/LIVE_ARTIFACT_PREVIEW_v07_6.md` for prototype provenance, design decisions, and test evidence.

### Accessibility hardening (v07.3)

Focus management, ARIA roles and labels, dialog containment, status announcements, Escape handling, and keyboard access improved across the editor. See `docs/UX_ACCESSIBILITY_HARDENING_v07_3.md`.

---

## Known limitations (summary)

- Local-first static app: no server, no account, no cloud sync, no collaborative editing.
- Primary automated coverage is Chromium/CDP; other browsers not excluded but require manual QA.
- `localStorage` unavailability handled safely; `file:` URL behavior may vary by browser.
- Unknown import schemas are not silently accepted.
- Duplicate-ID repair is deterministic but cannot infer artistic intent.
- No formal WCAG compliance claim.
- Live preview is temporary; preview state is discarded on project reload.
- No `allow-same-origin` in preview iframe; no preview postMessage messaging is used.

See `docs/KNOWN_LIMITS.md` for the full statement.

---

## Blockers

None. Documentation and verifier pass completely.

## Non-blockers

- Iframe runtime recreation after Export re-render: works as designed, disclosed in `docs/KNOWN_LIMITS.md` and `docs/EXPORT_PREVIEW_AND_RECOVERY.md`.
- Manual browser QA outside Chromium not automated.

---

## Next phase

**v07.8** — final release verification and checkpoint.

This is not a final release tag. v07.7 is a documentation release candidate. v07.8 will perform final release verification before a tagged release.

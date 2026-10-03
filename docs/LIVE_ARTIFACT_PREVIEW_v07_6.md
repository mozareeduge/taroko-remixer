# Live Embedded Artifact Preview — v07.6

> **Historical document.** This page describes the v07.x legacy editor (frozen at v07.8, archived at https://taroke-remixer.theblackbirdfield.com/archive/v07.8/), not the current app. Chamber names, file behaviour and URLs here may differ from TAROKO REMIXER v1.0.4. For the current app see the [README](../README.md) and [What Is TAROKO REMIXER?](WHAT_IS_TAROKO_REMIXER.md).

## Prototype provenance

A prototype commit (`0921001`) existed on branch `claude/artifact-preview-iframe-uqm74k`. It was
inspected as reference only and was never directly merged to main. It predated:

- Exact custom-bank import preservation (v07.5c)
- Real Grave v3.2 acceptance (v07.5c-r)
- Interaction-continuity architecture (v07.5d)
- Consumed-input trigger parity (v07.5e)

## Why 0921001 was not directly merged

The prototype:
1. Auto-built preview on Export chamber entry (called `buildPreview()` from navigation handlers)
2. Placed the iframe before export actions, breaking the action-first layout
3. Had no freshness signature — no UNBUILT / FRESH / STALE state model
4. Did not preserve scroll or focus on Build/Refresh
5. Did not reset preview on import or autosave restore
6. Claimed postMessage was "technically impossible" (incorrect)
7. Showed a blank space before the user clicked anything

## Prototype portions retained

- `C.exportProjectHtml(project)` as the single source for preview content
- `sandbox="allow-scripts"` without `allow-same-origin`
- No network URL — srcdoc only
- Preview build failure is independent from export downloads
- Class name `.livePreviewFrame`
- CDP test structure (heavily revised)

## Prototype portions rejected / reworked

| Rejected | Replacement |
|---|---|
| Auto-build on Export entry | Explicit Build button; UNBUILT state shown by default |
| Build called from `navigateStep()` | Build only called from `[data-build-preview]` click |
| Iframe rendered before export actions | Action-first layout: Save HTML / Export JSON / Copy JSON first |
| No freshness model | Full UNBUILT / FRESH / STALE / ERROR state model |
| No scroll/focus preservation | Scroll and focus explicitly captured and restored |
| No import/restore reset | `importFile()`, "New", and draft-restore all reset `ui.preview` |
| Inaccurate postMessage claim | Accurate security documentation (see below) |
| 19 CDP tests | 68 CDP tests across 7 groups |

## Action-first Export layout

The Export chamber renders in this order:

1. Export heading and kicker
2. Save playable HTML (primary action)
3. Export project JSON
4. Copy JSON
5. Concise distinction: JSON archive / standalone HTML / embedded preview
6. Preview status (ARIA `role=status` or `role=alert`)
7. Build / Rebuild / Refresh preview button
8. Iframe preview (below, visible only after a successful build)

At all tested viewports (1440×900 through 375×667 and 844×390 landscape), the three export
actions are visible and reachable before preview content.

## Preview state model

| State | Condition | Status text | Button label |
|---|---|---|---|
| UNBUILT | `builtSig === null` | "Live preview has not been built." | Build live artifact preview |
| FRESH | `sig === builtSig` | "Preview built from the current project." | Rebuild live artifact preview |
| STALE | `sig !== builtSig` | "Preview is out of date." | Refresh live artifact preview |
| ERROR | `ui.preview.error !== null` | "Preview failed: [message]" | Retry live artifact preview |

## Deterministic freshness signature

`previewSignature()` serializes all export-relevant project state:

```javascript
JSON.stringify({
  p:  project.project,        // title, author, sourceTitle, statement, credits
  m:  project.materials,      // trays, bankMeta (all token data)
  f:  project.forms,          // casePolicy, compoundPolicy, overrides
  d:  project.lineDevices,    // inputs, routes, templates
  st: project.stanzaPatterns, // slots, chance, repeat
  fl: project.flowScenes,     // stanzaId, chance, enabled
  tr: project.triggers,       // condition, chance, action
  su: project.surface,        // speedMs, retention, theme, fontSize
  n:  project.notes,          // notes are embedded in the exported JSON
  me: project.meta,           // importRepairs provenance
  sv: project.schemaVersion,  // migration version
})
```

Excluded from signature (editor-only volatile state not affecting the artifact):
- `ui.step`, `ui.tray`, `ui.device`, `ui.stanza`, `ui.token`
- `ui.openSelect`, `ui.drag`, `ui.timer`
- `ui.runState`, `ui.events`, `ui.selectedEvent`
- `ui.help`, `ui.msg`
- `ui.autosave.*`
- `ui.preview.*` (signature is not self-referential)

Signature calculation does not mutate the project.

## srcdoc construction

```javascript
function buildPreview() {
  // capture scroll/focus
  try {
    ui.preview.srcdoc = C.exportProjectHtml(project);  // same as Save HTML
    ui.preview.error  = null;
    ui.preview.builtSig = previewSignature();
  } catch(e) {
    ui.preview.error = e.message || 'Preview build failed.';
  }
  render();
  // restore scroll/focus via requestAnimationFrame
}
```

After render, `bind()` assigns the srcdoc via DOM property (not HTML attribute):

```javascript
const previewFrame = app.querySelector('.livePreviewFrame');
if (previewFrame && ui.preview.srcdoc) previewFrame.srcdoc = ui.preview.srcdoc;
```

DOM property assignment avoids HTML attribute entity encoding entirely. The browser receives
the raw HTML string directly.

## Sandbox and security boundaries

```
sandbox="allow-scripts"
```

- `allow-scripts`: required for the artifact's self-contained runtime to execute.
- `allow-same-origin` is **NOT** granted.

Without `allow-same-origin`, the iframe receives an opaque (`null`) origin.

Consequences (all intentional):
- The iframe **cannot** directly access the parent's same-origin DOM.
- The iframe **cannot** read or write the parent's `localStorage`.
- The iframe **cannot** access the parent's cookies.
- The iframe receives its own isolated `localStorage` that throws `SecurityError` on access.

## postMessage statement (accurate)

Cross-window `postMessage` is a browser capability that exists independently of iframe
sandboxing. Without `allow-same-origin`, the iframe's origin is `null`, so same-origin
postMessage guards on the parent side would reject messages from it by default — but
postMessage is not intrinsically blocked.

**This implementation does not send, receive, or register any preview postMessage listeners.**
No `window.addEventListener('message', ...)` handler is present in `src/app.js`. No
`postMessage()` call targets the preview iframe. Sandboxing is a containment measure for
the iframe runtime, not a claim that arbitrary HTML is universally safe.

## Autosave isolation

Editor key: `taroke.remixer.v07.draft`

1. `buildPreview()` does not call `saveDraft()`.
2. `buildPreview()` does not write to `localStorage` at all.
3. `ui.preview` state is ephemeral — it is not serialized to autosave or project JSON.
4. The iframe runtime receives an opaque origin; it cannot access the parent's `localStorage`.
5. Standalone HTML does not depend on editor autosave.
6. Preview freshness signature is stored only in memory (`ui.preview.builtSig`).

Test F57 explicitly verifies: "preview build does not write to autosave key."

## Scroll and focus preservation

Before `buildPreview()` renders:
1. Captures `.work` `scrollTop`
2. Captures `.rail` `scrollTop`

After `render()` completes, in `requestAnimationFrame`:
1. Restores `.work` `scrollTop`
2. Restores `.rail` `scrollTop`
3. Returns focus to `[data-build-preview]` (the triggering button, which re-renders at the same position)

The iframe itself is not autofocused. `navigateStep()` is not called. Document scroll is
not affected. Run-stage follow state is not affected.

## Exact custom import result

Fixture: `tests/fixtures/exact_custom_banks_project.taroke.json`

Expected tray order: `processed_bodies, labor_verbs, pressure_texture, relations, among_prep, reserve`

After import and Build:
- E46: Custom ordered banks embedded in exact order ✓
- E47: No classic-bank contamination (above/below/path/cave/river absent) ✓
- E48: `meta.importRepairs` provenance survives in embedded project ✓
- E49: Custom bank roles and `bankMeta` survive ✓

## Real Grave v3.2 result

The real Grave file was not mounted in this session. SHA-256 to verify when available:
`2f4f9897581ba7c0afb4ddb6f25ac61e3ef7b15c6bb7289492075cbae697fd98`

The `tests/run_real_grave_acceptance_cdp.py` suite (19 tests) covers Grave-shaped import fidelity
and remains green at 347→415 total.

## Trigger parity in preview runtime

The standalone miniRuntime embedded in exported HTML uses `consumedDirect` tracking identical to
the v07.5e fix in `core.js`. Tests E50–E52 verify:

- E50: A trigger matching a consumed rendered slot fires ✓
- E51: A trigger matching a selected but un-rendered (omitted) slot does not fire ✓
- E52: Editor core and preview produce identical output under deterministic conditions ✓

## Responsive evidence

All viewports tested with no horizontal overflow:
- 1440×900: desktop full layout
- 375×667: mobile portrait (G63)
- 390×844: mobile portrait (G64)
- 430×932: mobile portrait (G65)
- 844×390: mobile landscape (G66, A7)

Mobile bottom tabs do not cover export actions (G67).

## Tests added

Suite: `tests/run_live_preview_cdp.py`

| Group | Tests |
|---|---|
| A. Export entry and layout | A1–A7 (7) |
| B. Iframe construction | B8–B18 (11) |
| C. State and freshness | C19–C37 (19) |
| D. Refresh | D38–D45 (8) |
| E. Import and runtime parity | E46–E52 (7) |
| F. Export/autosave regression | F53–F59 (7) |
| G. Accessibility/responsive | G60–G68 (9) |
| **Total** | **68** |

## Screenshots

```
docs/screenshots/v07_6/
  desktop-export-preview-unbuilt.png   — UNBUILT state, export actions first
  desktop-export-preview-built.png     — FRESH state with iframe below
  desktop-export-preview-stale.png     — STALE state after title edit
  desktop-custom-import-preview.png    — custom-bank fixture imported and built
  mobile-375-export-preview.png        — 375×667 portrait with preview built
  mobile-844x390-export-actions.png    — 844×390 landscape, actions visible
```

## Final test total

- Previous baseline: 347 passed, 0 failed
- Live preview suite: +68
- **Total: 415 passed, 0 failed**

## Remaining limitations

1. The iframe is recreated on every `render()` call (e.g., during any live edit while on Export),
   which causes the artifact runtime to restart. This is acceptable because the preview state model
   (FRESH/STALE) makes it clear the preview reflects the last explicit Build, not live edits.

2. The real Grave v3.2 file was not available in this session. The Grave-shaped custom bank
   fixture and the existing `run_real_grave_acceptance_cdp.py` suite provide partial coverage.

3. srcdoc-assigned iframes may behave differently across browsers for very large projects. The
   DOM property approach (rather than HTML attribute encoding) is used to maximize compatibility.

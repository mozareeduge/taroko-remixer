# Interaction Continuity — v07.5d

## Summary

v07.5d fixes four classes of UX defects that broke perceived continuity in the TAROKO REMIXER editor:

| ID | Defect | Fix |
|----|--------|-----|
| A | Stale derived surfaces | Reactive `data-live-*` mirrors updated by `updateLiveMirrors()` on every identity field keystroke |
| B | Inherited scroll position | Centralized `navigateStep()` resets work scroll to top on every chamber change |
| C | Same-step render jumps | `renderPreserving()` captures and restores scroll positions, focus, caret, and textarea scroll before/after every non-navigation re-render |
| D | Run forced following | `_runFollowing` boolean tracks user scroll intent; run stage only auto-scrolls to new output when the user is near the bottom |

---

## Architecture

### Desktop viewport-bounded shell (styles.css)

```css
html,body{height:100%}
@media (min-width:901px){
  html,body{overflow:hidden}
  .app{height:100vh;height:100dvh;overflow:hidden;
       display:grid;grid-template-rows:auto minmax(0,1fr)}
  .layout{min-height:0}
  .rail{min-height:0;overflow-y:auto}
  .work{min-height:0;overflow-y:auto}
  .deviceListPanel{top:8px;max-height:calc(100% - 16px)}
}
```

At desktop widths (≥901px): the outer document does not scroll. `.rail` (step nav) and `.work` (chamber content) are independent scroll containers within a CSS grid row that fills the remaining viewport height.

At mobile (≤900px): the original document-scroll layout is preserved, with `padding-bottom:calc(130px + env(safe-area-inset-bottom,0px))` on `.workInner` to prevent the fixed bottom-tab bar from covering the final controls.

### `navigateStep(nextStep)` (src/app.js)

Central navigation entry point. Replaces all direct `ui.step = x; render()` calls.

Responsibilities:
- Closes any open dropdown (`ui.openSelect = null`)
- Preserves rail scroll across the re-render
- Resets `.work.scrollTop = 0` on chamber change
- Resets `window.scrollTo(0, 0)` for mobile document scroll
- Scrolls the active rail step button into view
- Focuses the chamber's first `panelTitle` heading (`tabindex="-1"`) so keyboard users land at the top of content

### `renderPreserving()` (src/app.js)

Wrapper for all non-navigation renders:

```
captureRenderState() → render() → requestAnimationFrame(restoreRenderState)
```

`captureRenderState()` records: `.work.scrollTop`, `.rail.scrollTop`, the active element's stable key (`data-bind`, `data-route-template`, etc.), selection range, and textarea internal scroll.

`restoreRenderState()` matches the stable key back to the new DOM element after render and restores focus, selection, and scroll.

Called by: `flash()`, all toolbar actions, select open/close, guide/help modal, draft dismiss/clear, Escape handler.

### `updateLiveMirrors()` (src/app.js)

Updates `[data-live-*]` elements without re-rendering. Attached to `data-bind` oninput handler for identity fields (title, author, sourceTitle, sourceUrl, statement, credits).

Mirror nodes:
- `[data-live-project-title]` — topbar status line, identity slip heading, surface preview stage head, run stage head
- `[data-live-project-author]` — identity slip author line
- `[data-live-source-title]` — identity slip source line, surface/run stage head
- `[data-live-statement]` — identity slip statement paragraph
- `[data-live-credits]` — identity slip credits
- `[data-live-export-name]` — export filename display

### Run following policy (src/app.js)

`_runFollowing` (module-level boolean) tracks whether the run stage should auto-scroll to new output.

- Initialized to `true` when run starts (`runStart()`)
- Set to `false` by a scroll event listener on `.stage.surfacePreview` when the user scrolls up (threshold: >80px from bottom)
- Set to `true` again when the user scrolls back near the bottom
- `tick()` checks near-bottom before re-render; only calls `stage.scrollTop = stage.scrollHeight` after render when `_runFollowing` is true

---

## Test suite

**File:** `tests/run_interaction_continuity_cdp.py`
**Count:** 51 tests

| Section | Tests | Coverage |
|---------|-------|----------|
| A. Scroll ownership | 8 | viewport-bounded shell, independent rail/work containers, no document scroll on navigation |
| B. Chamber entry | 10 | Run/Notes/Export each open at top; headings and primary controls visible; toolbar Export opens at top; active rail entry visible |
| C. Same-step continuity | 5 | Work scroll preserved on autosave re-render and toast; dropdown open preserves scroll; identity field input keeps focus; Escape closes select cleanly |
| D. Run continuity | 6 | Outer work/rail scroll unchanged during ticks; stage follows when near bottom; stage freezes when user scrolled up; following resumes; pause/resume preserves scroll |
| E. Reactive mirrors | 8 | Title/author/source title update immediately in identity slip, topbar, surface preview, run stage head, export filename; input stays focused during mirror update |
| F. Focus | 4 | Chamber heading has `tabindex=-1`; identity input doesn't steal focus; toast doesn't steal focus; Escape closes select without crash |
| G. Responsive | 10 | No horizontal overflow at 7 viewports (375/390/430/844/1024/1280/1440); mobile workInner padding sufficient; mobile navigation reachable; Run controls visible on mobile |

---

## Screenshots

`docs/screenshots/v07_5d/`

| File | What it shows |
|------|---------------|
| `desktop-1280-run-entry.png` | Run chamber opens at top, controls visible, no inherited scroll |
| `desktop-1280-notes-entry.png` | Notes chamber opens at top |
| `desktop-1280-export-entry.png` | Export chamber opens at top, Save HTML visible |
| `desktop-independent-rail-scroll.png` | Rail and work scrolled independently |
| `desktop-reactive-title.png` | Title edited in identity slip; topbar and slip update immediately |
| `mobile-375-run-entry.png` | Run controls visible on 375px mobile |
| `mobile-390-export-entry.png` | Export chamber on 390px mobile, no nav overlap |

---

## Migration notes

No data-model changes in this pass. No schema version bump needed. All existing `.taroke.json` and `.taroke.html` files continue to load without repair.

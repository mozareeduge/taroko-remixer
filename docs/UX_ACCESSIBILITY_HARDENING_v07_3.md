# TAROKO REMIXER — UX and Accessibility Hardening v07.3

Date: 2026-07-08
Branch: `claude/v07-3-ux-accessibility-ulb7pg`
Base: `main` at commit `f01e429` (v07.2 acceptance evidence)

---

## 1. Evidence Source

- v07.2 acceptance evidence: `docs/ACCEPTANCE_EVIDENCE_v07_2.md`
- v07.2 baseline: 133 passed, 0 failed
- Inspection of `src/app.js`, `styles.css`, rendered DOM via CDP/Chromium
- WCAG 2.2-inspired practical checks (see task scope)

---

## 2. Defects Found and Root Causes

### D1 — No `:focus-visible` CSS rule (keyboard focus invisible)
**Evidence:** CSS inspection found no `:focus-visible` selector. Hover outlines (`:hover`) existed but keyboard focus ring was browser-default only, which is absent or tiny in Chromium.
**Root cause:** `styles.css` had `:hover` outlines on controls but no explicit `:focus-visible` rule.
**WCAG target:** 1 — Visible focus indicator for actionable controls.

### D2 — Toast status message never rendered immediately
**Evidence:** `flash()` sets `ui.msg` but calls `render()` only in the 1800ms cleanup timeout, not immediately. Clicking the self-test button produces no visible toast.
**Root cause:** `flash(msg){ ui.msg=msg; setTimeout(()=>{ui.msg=''; render();},1800); }` — no `render()` on entry.
**WCAG target:** 9 — Error/status messaging remains perceivable.

### D3 — Toast not announced to screen readers
**Evidence:** Toast div had no `role="status"` or `aria-live="polite"` attribute.
**Root cause:** Template literal in `render()` omitted live region attributes.
**WCAG target:** 9 — Error/status messaging remains perceivable.

### D4 — Modals lack `role="dialog"` and `aria-modal`
**Evidence:** Guide modal and line inspector modal rendered as plain `<div class="modal">` with no ARIA role, no `aria-modal`, no `aria-labelledby`. Screen readers cannot identify them as dialogs.
**Root cause:** `guide()` and `lineInspector()` functions built modal markup without ARIA attributes.
**WCAG target:** 4 — Custom buttons/tabs expose useful name/role/state.

### D5 — Escape key does not close modals or open dropdowns
**Evidence:** Pressing Escape with guide modal open, line inspector open, or custom select dropdown open had no effect.
**Root cause:** No `keydown` listener existed for Escape key in `ui` overlay state.
**WCAG target:** 8 — No ordinary keyboard trap (users must be able to exit overlays).

### D6 — `customSelect` button has no accessible name link to visible label
**Evidence:** `<label>Default role</label>` and `<button class="customSelectBtn">` were siblings with no `for`/`id` or `aria-labelledby` association. Screen reader announced only the current value, not the field name.
**Root cause:** `customSelect()` function rendered a `<label>` without `id` and the button without `aria-labelledby`.
**WCAG target:** 4 — Custom controls expose useful name/role/state.

### D7 — `field()`, `area()`, `num()` helper labels not associated with inputs
**Evidence:** Source step fields (Title, Author, Statement, etc.) rendered `<label>TITLE</label><input>` without `for`/`id` linking. Screen readers cannot identify which label belongs to which input.
**Root cause:** Helper functions `field()`, `area()`, `num()` did not generate `id` on inputs or `for` on labels.
**WCAG target:** 4 — Custom controls expose useful name/role/state.

### D8 — ↑/↓ icon buttons have no accessible names
**Evidence:** Stanza slot and flow scene reorder buttons rendered as `<button>↑</button>` and `<button>↓</button>`. Arrow characters are not descriptive accessible names.
**Root cause:** `slotCard()` and `flow()` template strings used bare arrow characters with no `aria-label`.
**WCAG target:** 4 — Custom controls expose useful name/role/state.

---

## 3. Fixes Made

| # | File | Change |
|---|------|--------|
| D1 | `styles.css` | Added `:focus-visible{outline:3px solid #fff;outline-offset:2px}` plus explicit repetition for specific selectors as belt-and-suspenders |
| D2 | `src/app.js` | `flash()` now calls `render()` immediately before the timeout |
| D3 | `src/app.js` | Toast div: added `role="status" aria-live="polite"` |
| D4 | `src/app.js` | Guide modal: added `role="dialog" aria-modal="true" aria-labelledby="modal-guide-title"` and `id="modal-guide-title"` on title |
| D4 | `src/app.js` | Line inspector modal: added `role="dialog" aria-modal="true" aria-labelledby="modal-insp-title"` and `id="modal-insp-title"` on title |
| D5 | `src/app.js` | Added one-time `document.addEventListener('keydown',...)` for Escape, closing open custom select, line inspector, or guide modal |
| D6 | `src/app.js` | `customSelect()`: generates `id="csl-{key}"` on label and `aria-labelledby="csl-{key}"` on button |
| D7 | `src/app.js` | `field()`, `area()`, `num()`: generate `id="fld-{path}"` on input/textarea and `for="fld-{path}"` on label |
| D8 | `src/app.js` | Slot up/down buttons: added `aria-label="Move slot N up/down"` |
| D8 | `src/app.js` | Scene up/down buttons: added `aria-label="Move scene up/down"` |
| D8 | `src/app.js` | Scene toggle button: added `aria-pressed="true/false"` |
| D8 | `src/app.js` | Route move-up/down buttons: added `aria-label="Move route N up/down"` |

---

## 4. Tests Added

New file: `tests/run_a11y_cdp.py` — 28 tests

| Test | Covers |
|------|--------|
| focus-visible CSS rule exists in stylesheet | D1 |
| toast has aria-live="polite" | D3 |
| toast has role="status" | D3 |
| guide modal has role="dialog" | D4 |
| guide modal has aria-modal="true" | D4 |
| guide modal has aria-labelledby | D4 |
| guide modal labelledby element exists | D4 |
| Escape closes guide modal | D5 |
| customSelect button has aria-labelledby | D6 |
| customSelect labelledby element has text content | D6 |
| field label has for= attribute on source step | D7 |
| stanza slot up button has aria-label | D8 |
| stanza slot down button has aria-label | D8 |
| flow scene up button has aria-label | D8 |
| flow scene down button has aria-label | D8 |
| flow scene toggle button has aria-pressed | D8 |
| route move-up button has aria-label | D8 |
| route move-down button has aria-label | D8 |
| custom select opens on click | regression |
| Escape closes open custom select | D5 |
| line inspector modal has role="dialog" | D4 |
| line inspector modal has aria-modal="true" | D4 |
| Escape closes line inspector modal | D5 |
| 375px: no horizontal overflow | mobile |
| 430px: no horizontal overflow | mobile |
| run surface has no visible tick spans | regression |
| export step: save-html button present and not hidden | regression |
| export step: export-json button present and not hidden | regression |

---

## 5. Commands Run

```
node --check src/app.js        # syntax check
node --check src/core.js       # syntax check
python3 tests/run_a11y_cdp.py  # new suite: 28 passed, 0 failed
./tests/run_all_tests.sh       # full suite: 161 passed, 0 failed
```

---

## 6. Screenshots Produced

Located in `docs/screenshots/v07_3/`:

| File | Description |
|------|-------------|
| `desktop_source_step.png` | Desktop 1280×900, source step with label-for fields |
| `desktop_devices_a11y.png` | Desktop, devices step with route move buttons (aria-label added) |
| `desktop_guide_modal_a11y.png` | Desktop, guide modal with role=dialog |
| `desktop_run_surface_a11y.png` | Desktop, run surface (no tick spans regression confirmation) |
| `mobile_375_source_a11y.png` | 375px mobile, source step (no horizontal overflow) |

---

## 7. Test Suite Results

| Suite | Passed | Failed |
|-------|--------|--------|
| `run_core_tests.js` | 14 | 0 |
| `run_core_extended_tests.js` | 38 | 0 |
| `run_browser_functional_cdp.py` | 16 | 0 |
| `run_user_notes_regression_cdp.py` | 10 | 0 |
| `run_route_template_regression_cdp.py` | 5 | 0 |
| `run_cdp_deep_qa.py` | 50 | 0 |
| `run_a11y_cdp.py` | 28 | 0 |
| **TOTAL** | **161** | **0** |

---

## 8. Remaining Non-Blockers

- **Focus restoration after modal close** — When a modal closes, focus returns to the document body rather than the element that triggered the modal. Full focus restoration requires storing trigger element references across render cycles. No keyboard trap exists; this is a convenience improvement left for a future pass.
- **Focus trap inside modal** — Tabbing inside an open modal will eventually reach background controls. WCAG 2.1.2 (No Keyboard Trap) is not violated because focus is not stuck; users can reach the close button. A full focus trap implementation is deferred.
- **Inline field constructs without for/id** — Fields built inline in `deviceEditor()`, `samples()`, `stanzaStep()`, `flow()`, `triggers()` use ad-hoc label/input markup not covered by the `field()` helper and do not have `for`/`id` association. These are candidates for a future structural pass.
- **customSelect keyboard navigation** — The listbox can be opened via keyboard (Tab then Enter/Space on the button), but arrow key navigation inside the listbox is not implemented. Options are reachable via Tab. Full arrow key support is deferred.

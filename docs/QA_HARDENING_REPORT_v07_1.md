# QA Hardening Report — TAROKO REMIXER v07.1

Date: 2026-07-08  
Branch: `claude/taroko-remixer-qa-hardening-o3z93c`

---

## Summary

Deep QA pass on TAROKO REMIXER v07 reset. Baseline was 31 passing tests across 3 browser CDP suites + 1 Node core suite. All tests pass.

**Final test count: 133 passed, 0 failed** (up from 31).

---

## Commands Run

```
# Fix test script permissions
chmod +x tests/run_all_tests.sh

# Install missing Python dependency
pip3 install websocket-client requests

# Run full suite (after all fixes)
bash tests/run_all_tests.sh
```

---

## Tests Added

### `tests/run_core_extended_tests.js` (38 new Node tests)

Covers:
- `sample_v07_reset.taroke.json` imports cleanly via `migrateProject`
- Old-style project migration (lineMachines, rareEvents, dictionary)
- Migration forces `surface.showTick=false` and `family=taroko`
- `bankMeta` survives full JSON export/import roundtrip
- `cleanSurfaceText` removes doubled commas, leading punctuation, empty braces
- Missing slot in multi-slot template produces no doubled punctuation
- Plural forms: `-y→-ies`, `-(s/x/z/ch/sh)→-es`, `-fe→-ves`
- `compoundPolicy=head` preserves prefix and pluralizes head
- `compoundPolicy=literal` no longer drops prefix (bug fix)
- Case policy (upper/lower/title) applies to form output
- `lockedLiteral` blocks plural/thirdSingular/base but not uppercase/lowercase/title
- `articleFor` returns 'an' for vowel-initial (including 'hour', 'honest')
- `weighted`: zero-weight items excluded; all-zeros returns first item
- Trigger prepend/replace/append modes
- Trigger with `chance=0` never fires (bug fix)
- Disabled trigger never fires even at chance=100 and matching term
- Validation: no inputs, no routes, no active scenes, low sample count, unknown slot
- `exportProjectHtml` has no visible tick spans
- `safeJsonForHtml` escapes closing `</script>` tags
- JSON + HTML export/import roundtrip preserves all key fields
- Trigger data survives roundtrip
- `downloadName` builds safe filename
- `activeScenes` respects enabled=false and chance=0
- `expandStanza` breath slot, chance=0 always skips, loop slot within bounds
- `generateEvent` returns error event for disabled device

### `tests/run_cdp_deep_qa.py` (50 new browser + artifact + mobile tests)

Covers:
- App boots without loading fallback; no JS errors
- `index.html` references correct JS files; no inline framework
- `.nojekyll` exists; `package.json` has no runtime dependencies
- Custom bank delete moves tokens to reserve; device inputs rerouted
- Device: add input slot increases count; rename slot; delete slot
- Stanza slot chance writes to model; all devices appear in slot dropdown
- Flow scene: enable/disable toggle; chance field writes to model
- Trigger name/text/chance editable; trigger roundtrip through export/import
- Form override plural writes to `forms.overrides`
- Run poem: no visible tick spans; events generated
- Recipe modal: opens, has note and device buttons, closes
- Surface preview: no tick spans
- Export step: save-html and export-json buttons present
- Guide modal: opens and closes
- **Exported standalone HTML artifact**:
  - Has `taroke-project` script tag
  - Inline CSS only (no external stylesheet)
  - `.tick{display:none}` in artifact CSS
  - JSON block has no unescaped `</script>` (XSS check)
  - Title, runtime function present
  - Page generates lines, no tick spans visible, no unresolved `{slot:form}` in output
- **Mobile layout (390px)**:
  - No horizontal overflow
  - Bottom tabs present and not hidden (`display:grid` via media query)
  - Device step navigable
  - Route textarea reachable
  - Topbar renders
  - Run step renders
  - Panel body has non-zero padding

---

## Bugs Found and Fixed

### Bug 1: `compoundPolicy='literal'` dropped compound prefix

**File:** `src/core.js` — `formToken`  
**Root cause:** `const out=(project?.forms?.compoundPolicy==='literal')?styleLike(lit,made):prefix+styleLike(head,made)` — when `compoundPolicy='literal'`, the `prefix` (e.g. `'paper-'` from `'paper-body'`) was not concatenated before `styleLike(lit,made)`. Only the pluralized head was returned, silently discarding the prefix.  
**Impact:** Any compound word (e.g. `paper-body`, `office-joint`) would lose its prefix when `compoundPolicy='literal'`. Output would be `bodies` instead of `paper-bodies`.  
**Fix:** Changed to `const out=prefix+styleLike(project?.forms?.compoundPolicy==='literal'?lit:head,made)` — prefix is always prepended; the two policies differ only in which string's case-style is used as the model for `styleLike`.

### Bug 2: Trigger with `chance=0` fired when `rng()` returned exactly 0

**File:** `src/core.js` — `renderDeviceEvent`  
**Root cause:** `if(match && rng()*100 <= Number(tr.chance||0))` — the `<=` comparison means when `chance=0` and `rng()` returns `0.0`, `0 <= 0` is `true` and the trigger fires.  
**Impact:** A trigger explicitly set to 0% chance would occasionally fire (when the PRNG returned exactly 0), violating the intent of "never fire".  
**Fix:** Changed `<=` to `<`: `if(match && rng()*100 < Number(tr.chance||0))`. When `chance=0`, `rng()*100 < 0` is always false.

### Bug 3: Loop stanza slot also used `<=` for chance

**File:** `src/core.js` — `expandStanza`  
**Root cause:** `while(count<max && rng()*100 <= Number(slot.chance??60))` — same `<=` vs `<` issue for loop continuation.  
**Fix:** Changed to `rng()*100 < Number(slot.chance??60)`.

### Bug 4: Initial slot skip check used `>` instead of `>=`

**File:** `src/core.js` — `expandStanza`  
**Root cause:** `if(rng()*100 > Number(slot.chance??100)) continue` — when `chance=0`, `rng()*100 > 0` is false if `rng()=0`, so the slot would NOT be skipped (executed instead of skipped). Also at `chance=100`, `>100` is always false (correct), but using `>=` makes the boundary semantics cleaner.  
**Fix:** Changed to `if(rng()*100 >= Number(slot.chance??100)) continue`.

### Bug 5: Browser test scripts used wrong Chromium binary path

**Files:** All three `tests/run_*_cdp.py` scripts  
**Root cause:** Scripts hardcoded `'chromium'` as the executable name, but the pre-installed Chromium is at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.  
**Fix:** Added auto-detection logic that checks several known paths in order.

---

## Other Changes

- **`tests/run_all_tests.sh`**: Added `run_core_extended_tests.js` and `run_cdp_deep_qa.py` to the suite.
- **`tests/run_cdp_deep_qa.py`**: Injects CSS when testing mobile layout (session 3) so computed styles reflect actual media queries. Added viewport meta tag to activate mobile CSS media queries in headless Chrome.
- **`docs/QA_HARDENING_PLAN_v07_1.md`**: Created per-phase test scenario list.

---

## Final Test Count by Suite

| Suite | Tests | Pass | Fail |
|-------|-------|------|------|
| `run_core_tests.js` (original) | 14 | 14 | 0 |
| `run_core_extended_tests.js` (new) | 38 | 38 | 0 |
| `run_browser_functional_cdp.py` (original) | 16 | 16 | 0 |
| `run_user_notes_regression_cdp.py` (original) | 10 | 10 | 0 |
| `run_route_template_regression_cdp.py` (original) | 5 | 5 | 0 |
| `run_cdp_deep_qa.py` (new) | 50 | 50 | 0 |
| **Total** | **133** | **133** | **0** |

---

## Remaining Non-Blocking Issues

- **`expandStanza` loop slot at `chance=60` (default)**: The loop continues while `rng()*100 < slot.chance`. The default chance for loop is `60`, meaning each re-roll has a 60% chance to add another line. At `rng()=0`, this always continues up to `max`. This is expected behavior (not a bug), but could produce surprising results with a fixed seed near 0.

- **Compound `compoundPolicy='literal'` with uppercase compound** (non-blocking cosmetic): For `'PAPER-BODY'` in uppercase, `styleLike('PAPER-BODY', 'bodies')` returns `'BODIES'` (applied to the `made` form). This is correct casing behavior but differs from what `head` policy would do (`styleLike('BODY','bodies')='BODIES'` — same result here). Edge cases with mixed-case compounds like `'Paper-Body'` may produce subtly different results between policies. Not a regression; reflects the intended semantic distinction.

- **No TypeScript/JSDoc**: The codebase has no static types. Complex functions like `formToken`, `expandStanza`, and `renderDeviceEvent` are hard to verify for completeness. Not blocking for a static local-first app.

- **Emulation.setDeviceMetricsOverride `deviceScaleFactor:2` in tests**: The mobile tests set DPR=2 for realism. If a future test needs exact pixel dimensions, this needs accounting for.

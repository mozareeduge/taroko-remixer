# Test report — v07.8 release checkpoint

> Historical: this report covers the frozen v07.8 legacy app (root `index.html`, `styles.css`, `src/`), not the live v1.0.4 app.

Command:

```bash
./tests/run_all_tests.sh
```

Result:

- Core/static: 14 passed, 0 failed.
- Core extended: 38 passed, 0 failed.
- Import fidelity (JS): 35 passed, 0 failed.
- Browser functional CDP: 16 passed, 0 failed.
- User-notes regression: 10 passed, 0 failed.
- Route-template regression: 5 passed, 0 failed.
- CDP deep QA: 50 passed, 0 failed.
- Accessibility/CDP hardening: 28 passed, 0 failed.
- Autosave/recovery CDP: 19 passed, 0 failed.
- Import fidelity CDP: 30 passed, 0 failed.
- Interaction continuity CDP: 51 passed, 0 failed.
- Trigger compatibility regression: 3 passed, 0 failed.
- Trigger runtime parity (JS): 32 passed, 0 failed.
- Trigger runtime parity CDP: 16 passed, 0 failed.
- Live preview CDP: 76 passed, 0 failed. (includes Section H: Iframe Stability — 8 new tests)
- Documentation verification: 111 passed, 0 failed. (includes v07.8 metadata checks — 6 new tests)

Total: 534 passed, 0 failed.

### v07.7 historical total

520 passed, 0 failed (16 suites — verified 2026-07-11 before v07.8 additions).

## Import fidelity suite breakdown (JS — run_import_fidelity_tests.js)

| Test | Result |
|---|---|
| defaultProject still has classic banks | PASS |
| explicit custom trays: no classic banks injected | PASS |
| custom project: exact custom bank set preserved | PASS |
| explicit empty tray remains empty | PASS |
| legacy dictionary migrates exactly without extra banks | PASS |
| missing trays use default classic banks | PASS |
| bankMeta contains only actual project trays | PASS |
| custom role values adverb and preposition survive migration | PASS |
| imported bankMeta labels survive migration | PASS |
| tray key order is preserved after migration | PASS |
| explicit empty lineDevices remains empty | PASS |
| explicit empty stanzaPatterns remains empty | PASS |
| explicit empty flowScenes remains empty | PASS |
| validation reports unusable empty-collection project | PASS |
| duplicate token IDs are repaired deterministically | PASS |
| migration is idempotent: double-migrate does not change structure | PASS |
| stable importRepairs across repeated migration (m1→m2→m3) | PASS |
| JSON round-trip preserves exact custom tray set | PASS |
| HTML round-trip preserves exact custom tray set | PASS |
| token literals and weights survive JSON round-trip | PASS |
| bankMeta roles survive JSON round-trip | PASS |
| device input tray references survive round-trip | PASS |
| duplicate-ID repair records provenance in meta.importRepairs | PASS |
| legacy dict: lineMachines become lineDevices | PASS |
| legacy dict: rareEvents become triggers | PASS |
| surface.showTick=false and family=taroko are invariants | PASS |
| absent lineDevices use classic defaults | PASS |
| explicit empty materials.trays produces empty tray set | PASS |
| projectTrayDefs returns only actual project trays | PASS |
| generation succeeds on custom project without errors | PASS |
| validation: custom project with correct device inputs has no missing-tray errors | PASS |
| duplicate ID form override: first-occurrence reference is unbroken after repair | PASS |
| unique form override reference survives migration | PASS |
| duplicate ID note link: first-occurrence linkedTokenId survives | PASS |
| idempotent reference repair: double-migrate leaves overrides unchanged | PASS |

## Import fidelity suite breakdown (CDP — run_import_fidelity_cdp.py)

| Test | Result |
|---|---|
| app boots with default project | PASS |
| default project shows ABOVE bank on Samples | PASS |
| import succeeds without crash | PASS |
| Samples: no classic banks visible after custom import | PASS |
| Samples: first selected bank is a valid imported bank | PASS |
| Samples: all imported bank labels are visible | PASS |
| Samples: bank order matches fixture order | PASS |
| bankMeta: relations role is adverb | PASS |
| bankMeta: among_prep role is preposition | PASS |
| Devices: no classic bank labels in device editor | PASS |
| Devices: custom bank label present in device editor | PASS |
| Devices: device inputs reference only custom banks | PASS |
| Triggers: no classic bank labels in trigger selector | PASS |
| New device: no reference to classic bank "above" | PASS |
| New trigger: does not reference classic bank "above" | PASS |
| New input: does not reference classic bank "reserve" | PASS |
| Export JSON: no injected classic banks in tray set | PASS |
| Export JSON: custom banks present | PASS |
| Run: line events generated from custom banks | PASS |
| Run: no blank line surfaces | PASS |
| 375px: no horizontal overflow with custom bank list | PASS |
| Bank deletion: referenced bank deletion is blocked | PASS |
| Bank deletion: unreferenced bank deleted without reserve recreation | PASS |
| New project after custom import shows classic ABOVE bank | PASS |
| New project has default classic above tray | PASS |
| Re-import: tray key order preserved | PASS |
| Samples: adverb role visible for relations bank | PASS |
| Samples: preposition role visible for among_prep bank | PASS |
| HTML round-trip: exact tray set preserved | PASS |
| No uncaught errors detected | PASS |

## Autosave/recovery suite breakdown

| Test | Result |
|---|---|
| edit project → autosave writes to localStorage key | PASS |
| saved value contains savedAt and project payload | PASS |
| autosave status is perceivable text | PASS |
| mobile 375px: no horizontal overflow from autosave UI | PASS |
| no visible tick/line-number regression in run surface | PASS |
| standalone HTML export does not embed autosave storage key | PASS |
| standalone HTML does not write to editor autosave key | PASS |
| clear saved draft removes draft from localStorage | PASS |
| autosave stores schemaVersion in saved wrapper | PASS |
| boot with saved draft → restore prompt appears | PASS |
| restore loads saved draft content | PASS |
| dismiss keeps current/default state (no silent restore) | PASS |
| dismiss hides restore prompt | PASS |
| corrupt saved draft does not crash app | PASS |
| corrupt draft: restore prompt not shown | PASS |
| schema/version mismatch does not crash app | PASS |
| schema/version mismatch does not silently load project | PASS |
| localStorage unavailable: app boots without crash | PASS |
| localStorage unavailable: autosave unavailable message shown | PASS |

## Interaction continuity suite breakdown (CDP — run_interaction_continuity_cdp.py)

| Section | Test | Result |
|---------|------|--------|
| A. Scroll ownership | A1: desktop app shell is viewport-bounded | PASS |
| A. Scroll ownership | A2: .rail is independently scrollable | PASS |
| A. Scroll ownership | A3: .work is independently scrollable | PASS |
| A. Scroll ownership | A4: document.scrollTop stays at 0 during navigation | PASS |
| A. Scroll ownership | A5: rail scroll does not move work | PASS |
| A. Scroll ownership | A6: work scroll does not move rail | PASS |
| A. Scroll ownership | A7: .work scroll container has usable height | PASS |
| A. Scroll ownership | A8: run stage scroll container present | PASS |
| B. Chamber entry | B9: navigate to Run resets work scroll to top | PASS |
| B. Chamber entry | B10: Run heading visible on chamber entry | PASS |
| B. Chamber entry | B11: Run controls (Run/Pause/Reset) visible on entry | PASS |
| B. Chamber entry | B12: navigate to Notes resets work scroll to top | PASS |
| B. Chamber entry | B13: Notes heading visible on entry | PASS |
| B. Chamber entry | B14: navigate to Export resets work scroll to top | PASS |
| B. Chamber entry | B15: Export Save HTML button visible on entry | PASS |
| B. Chamber entry | B16: Export JSON button visible on entry | PASS |
| B. Chamber entry | B17: toolbar Export opens at top | PASS |
| B. Chamber entry | B18: active rail entry visible within rail | PASS |
| C. Same-step continuity | C20: work scroll preserved after field edit (autosave update) | PASS |
| C. Same-step continuity | C22: work scroll preserved when toast appears/expires | PASS |
| C. Same-step continuity | C24: custom select open preserves work scroll | PASS |
| C. Same-step continuity | C25: focus preserved during identity field input | PASS |
| C. Same-step continuity | C26: Escape closing select preserves work scroll | PASS |
| D. Run continuity | D31/32: timer ticks do not change outer work scroll | PASS |
| D. Run continuity | D33: rail scroll does not change during run | PASS |
| D. Run continuity | D34: stage follows new output when near bottom | PASS |
| D. Run continuity | D35/36: stage does not auto-scroll after user scrolls up | PASS |
| D. Run continuity | D37/38: following resumes after scroll back to bottom | PASS |
| D. Run continuity | D39: pause/resume preserves outer scroll | PASS |
| E. Reactive mirrors | E41: source identity slip updates immediately on title input | PASS |
| E. Reactive mirrors | E42: topbar status updates immediately on title input | PASS |
| E. Reactive mirrors | E43: title input stays focused during mirror update | PASS |
| E. Reactive mirrors | E44: author mirror updates immediately | PASS |
| E. Reactive mirrors | E45: source title mirror updates immediately | PASS |
| E. Reactive mirrors | E46: Surface chamber preview shows current title | PASS |
| E. Reactive mirrors | E47: Run chamber stage head shows current title | PASS |
| E. Reactive mirrors | E48: Export filename mirror reflects current title | PASS |
| F. Focus | F53/54: chamber heading has tabindex=-1 | PASS |
| F. Focus | F55: identity field input does not steal focus | PASS |
| F. Focus | F56: toast does not steal focus from active input | PASS |
| F. Focus | F57: Escape closes select without crashing app | PASS |
| G. Responsive | G57: no horizontal overflow at mobile-375x667 | PASS |
| G. Responsive | G57: no horizontal overflow at mobile-390x844 | PASS |
| G. Responsive | G57: no horizontal overflow at mobile-430x932 | PASS |
| G. Responsive | G57: no horizontal overflow at landscape-844x390 | PASS |
| G. Responsive | G57: no horizontal overflow at tablet-1024x768 | PASS |
| G. Responsive | G57: no horizontal overflow at desktop-1280x800 | PASS |
| G. Responsive | G57: no horizontal overflow at desktop-1440x900 | PASS |
| G. Responsive | G58: mobile nav does not cover Export Save HTML at 390px | PASS |
| G. Responsive | G59: all chambers reachable on mobile (notes chamber test) | PASS |
| G. Responsive | G60: Run controls visible on mobile entry | PASS |

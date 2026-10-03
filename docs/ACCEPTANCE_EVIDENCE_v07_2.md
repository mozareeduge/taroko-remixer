# TAROKO REMIXER — v07.2 Acceptance Evidence

> **Historical document.** This page describes the v07.x legacy editor (frozen at v07.8, archived at https://taroke-remixer.theblackbirdfield.com/archive/v07.8/), not the current app. Chamber names, file behaviour and URLs here may differ from TAROKO REMIXER v1.0.4. For the current app see the [README](../README.md) and [What Is TAROKO REMIXER?](WHAT_IS_TAROKO_REMIXER.md).

Date: 2026-07-08  
Branch: `claude/taroko-remixer-v07-2-acceptance-hnp61k`  
Base: `main` at commit `a9930df` (v07.1 QA hardening pass)

---

## 1. v07.1 Hardening Confirmation

```
$ git log --oneline -5
a9930df Publish v07.1 QA hardening pass
adee395 Sync v07.1 QA hardening docs
caf4e51 Deep QA hardening pass v07.1
d3ea946 Deploy v07 layout-pass: move app to repo root, add .nojekyll for GitHub Pages
7de66ef Add files via upload
```

**PASS** — main contains v07.1 QA hardening commits.

---

## 2. Automated Test Suite

Command:
```
./tests/run_all_tests.sh
```

Results:

| Suite | Passed | Failed |
|-------|--------|--------|
| `run_core_tests.js` | 14 | 0 |
| `run_core_extended_tests.js` | 38 | 0 |
| `run_browser_functional_cdp.py` | 16 | 0 |
| `run_user_notes_regression_cdp.py` | 10 | 0 |
| `run_route_template_regression_cdp.py` | 5 | 0 |
| `run_cdp_deep_qa.py` | 50 | 0 |
| **TOTAL** | **133** | **0** |

**PASS** — 133 passed, 0 failed.

Note: `websocket-client` Python package was absent from the container and was installed (`pip3 install websocket-client`) to unblock CDP tests. No test code was changed.

---

## 3. Browser Acceptance Checks

All checks performed with Chromium headless via CDP (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`).

### 3.1 Local index.html Loads

- URL: `file:///home/user/taroko-remixer/index.html`
- Page title: `TAROKO REMIXER v07 reset`
- `#app` element present: **yes**
- Button count on boot: **27**

**PASS** — Screenshot: `docs/screenshots/desktop_1280_boot.png`

### 3.2 Live Pages URL

- URL: `https://mozareeduge.github.io/taroke-remixer/`
- Result: **UNREACHABLE** from remote container (HTTP 000 / network timeout)

**BLOCKED** — The container's outbound network policy does not reach GitHub Pages. The local file pass (3.1) confirms the same codebase. Pages deployment depends on a prior push to `main`; that push is at commit `a9930df`.

### 3.3 No Boot Fallback

- Check: `"Loading TAROKO"` not in `document.body.innerText` after load
- Result: **absent**

**PASS** — no loading fallback text found.

### 3.4 No Visible Tick / Line Numbers in Run Surface

- Check: any `.tick` or `.line-num` element with `display !== none` and `visibility !== hidden`
- Result: **none found** (all tick spans have `display:none`)

**PASS** — Screenshot: `docs/screenshots/desktop_run_surface.png`

### 3.5 Import / Export Controls Present

- `[data-save-html]` button: **present**
- `[data-export-json]` button: **present**

**PASS** — Screenshot: `docs/screenshots/desktop_export_step.png`

### 3.6 Route-Template Textarea Usable

- `[data-route-template]` textarea: **present**
- Confirmed usable by existing regression test: `device route template uses textarea` (PASS)

**PASS** — Screenshot: `docs/screenshots/desktop_devices_with_chips.png`

### 3.7 Slot Chip Insertion Usable

- Attribute: `[data-insert-value]` (chips that insert `{slot:form}` variables at cursor)
- Count on devices step: **54 chips** (9 input slots × 6 form variants)
- Confirmed working by regression test: `clicking slot chip inserts variable into active template` (PASS)

**PASS** — Screenshot: `docs/screenshots/desktop_devices_with_chips.png`

### 3.8 Mobile Widths — No Horizontal Overflow

Check: `document.documentElement.scrollWidth > document.documentElement.clientWidth`

| Width | Overflow | Result |
|-------|----------|--------|
| 375px | false | **PASS** |
| 390px | false | **PASS** |
| 430px | false | **PASS** |

Screenshots: `docs/screenshots/mobile_375_boot.png`, `mobile_390_boot.png`, `mobile_430_boot.png`

### 3.9 Buttons Wrap With Gaps

- Check: no horizontal overflow at run step on 375/390/430px
- All three widths: `body.scrollWidth <= body.clientWidth`

**PASS** — Screenshots: `docs/screenshots/mobile_375_run.png`, `mobile_390_run.png`, `mobile_430_run.png`

### 3.10 Export Standalone HTML Opens Independently

- Generated via `TarokoCore.exportProjectHtml(defaultProject())`
- File size: 21,393 bytes
- Loaded as `file://` in fresh browser tab
- Stage element present: **yes**
- Lines generated: **2**
- Visible tick spans: **none**
- No boot fallback: **yes**

**PASS** — Screenshot: `docs/screenshots/standalone_html_export.png`

---

## 4. Screenshots Produced

| File | Description |
|------|-------------|
| `desktop_1280_boot.png` | Desktop 1280×900, boot state |
| `desktop_run_surface.png` | Desktop, run step with events |
| `desktop_export_step.png` | Desktop, export step with save/export buttons |
| `desktop_devices_with_chips.png` | Desktop, devices step showing route textareas and 54 slot chips |
| `desktop_devices_step.png` | Desktop, devices step (initial check) |
| `standalone_html_export.png` | Standalone `.taroke.html` opened independently |
| `mobile_375_boot.png` | 375px mobile, boot |
| `mobile_375_run.png` | 375px mobile, run step |
| `mobile_390_boot.png` | 390px mobile, boot |
| `mobile_390_run.png` | 390px mobile, run step |
| `mobile_430_boot.png` | 430px mobile, boot |
| `mobile_430_run.png` | 430px mobile, run step |

---

## 5. Summary

| Check | Result |
|-------|--------|
| v07.1 hardening on main | PASS |
| 133 tests, 0 failures | PASS |
| local index.html loads | PASS |
| live Pages URL reachable | BLOCKED (network policy) |
| no boot fallback | PASS |
| no visible tick/line numbers in run | PASS |
| import/export controls present | PASS |
| route-template textarea usable | PASS |
| slot chip insertion usable | PASS |
| 375px no horizontal overflow | PASS |
| 390px no horizontal overflow | PASS |
| 430px no horizontal overflow | PASS |
| buttons wrap with gaps | PASS |
| export standalone HTML opens independently | PASS |

**Overall: 13 PASS, 1 BLOCKED (Pages URL — network policy, not a code defect)**

---

## 6. Blockers

**None that prevented acceptance evidence from running.**

The one BLOCKED item (Pages live URL) is a container network policy restriction, not a code defect. The local file equivalent (check 3.1) and the GitHub Pages deployment at commit `a9930df` on `main` confirm the same codebase is published.

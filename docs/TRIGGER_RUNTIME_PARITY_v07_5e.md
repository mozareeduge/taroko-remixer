# Trigger Runtime Parity — v07.5e

> **Historical document.** This page describes the v07.x legacy editor (frozen at v07.8, archived at https://taroke-remixer.theblackbirdfield.com/archive/v07.8/), not the current app. Chamber names, file behaviour and URLs here may differ from TAROKO REMIXER v1.0.4. For the current app see the [README](../README.md) and [What Is TAROKO REMIXER?](WHAT_IS_TAROKO_REMIXER.md).

## Problem

In v07.5d and earlier, a trigger could fire from a sample that was *selected* for a device input even if that input's slot was **not consumed** by the chosen route template. A trigger watching `tray: "bank_b"` would fire whenever `bank_b` appeared in the device's `inputs` array, regardless of whether the route template contained `{slot_b:…}`.

This means the trigger could affect the rendered surface for a word the surface never showed — a semantic mismatch that made trigger conditions misleading and made the system impossible to reason about.

Additionally, the `miniRuntime()` (the self-contained JS string embedded in exported `.taroke.html` files) had **no trigger support at all** — exported files would generate lines but never evaluate triggers.

## Fix

### Consumed-input model

`renderDeviceEvent()` in `src/core.js` now tracks two sets during template rendering:

- **`consumedDirect`** — slots explicitly referenced via `{slotName:form}` in the template. A slot is added when it has a selected token and its placeholder appears in the template string.
- **`consumedDerived`** — slots read by `{article:a}` to choose "a" vs "an". The `{article:a}` helper reads the first `noun`-role input (or first input) to determine the vowel sound of the phrase; that slot is marked derived even though its literal never appears directly.

These sets are materialised into a `consumedInputs` array on each event:

```js
consumedInputs: [
  {
    slot: 'slot_a',
    tray: 'bank_a',
    tokenId: 'ta_1',
    sourceLiteral: 'alpha',
    direct: true,
    derived: false
  }
]
```

### Trigger matching

Triggers now filter against `consumedInputs` instead of all device inputs:

```
candidates = consumedInputs.filter(ci =>
  ci.tray === trigger.condition.tray &&
  (!term || ci.sourceLiteral.toLowerCase() === term.toLowerCase())
)
if (candidates.length === 0) continue   // no chance RNG call
if (rng() * 100 < trigger.chance) { … fire … }
```

Key guarantees:
- No chance RNG call is made when no consumed candidate exists.
- First-match wins; subsequent triggers are not evaluated after a fire.
- `enabled: false` skips the trigger entirely.
- `term: ""` matches any consumed input in that tray (wildcard).

### Trigger provenance

When a trigger fires, the event carries a `trigger` object:

```js
trigger: {
  id: 'tr_beta',
  name: 'beta trigger',
  text: '[BETA TRIGGER]',
  type: 'append',           // 'append' | 'prepend' | 'replace'
  conditionTray: 'bank_b',
  conditionTerm: 'beta',
  matchedSlot: 'slot_b',
  matchedTokenId: 'tb_1',
  matchedSourceLiteral: 'beta'
}
```

### miniRuntime parity

The `miniRuntime()` string (embedded in exported HTML) now includes the same consumed-input tracking and trigger evaluation loop. Exported `.taroke.html` files now honour triggers at runtime.

### Line inspector

The `lineInspector()` panel in `src/app.js` now distinguishes consumed vs. selected-but-omitted inputs:

- **Consumed samples** — tokens whose slot appeared in (or was derived by) the route template. Shown as clickable chip buttons that jump to the sample bank.
- **Selected but not rendered** — tokens selected by the device for a slot that was omitted from the chosen route. Shown as locked chips with an explanatory tooltip.
- **Trigger provenance** — when a trigger fires, a micro line shows: `Trigger: <trigger name> matched slot <slot> (<source literal>)`.

## Article-helper derived consumption

The `{article:a}` placeholder reads the first `noun`-role input (or first input if no noun-role) to determine the article ("a" vs "an"). That slot is counted as *derived* in `consumedInputs` — its token contributes to the rendered surface even though only "a" or "an" appears, not the literal itself. Triggers watching the corresponding tray can fire from this derived consumption.

## Semantic contract

> A trigger fires if and only if:
> 1. the trigger is `enabled`,
> 2. at least one entry in `consumedInputs` matches the trigger's `tray` (and, if non-empty, `term`), and
> 3. `rng() * 100 < chance`.

## Compatibility note

No existing trigger definitions are modified by this change. The `enabled` field on every trigger in imported and default projects is preserved exactly as-is. In particular, no real *Grave* triggers are automatically enabled: any trigger that was `enabled: false` in a prior project remains disabled after migration through v07.5e.

## Punctuation cleanup

The `cleanSurfaceText()` helper was extended (line 148 of `src/core.js`): the second character class in the doubled-punctuation replacement now includes `.` so that sequences like `,.` (produced when a missing-variable placeholder is followed by a full-stop) are correctly collapsed.

## Test suites

| Suite | Count | Result |
|---|---|---|
| `run_trigger_compatibility_regression.js` | 3 | 3 passed, 0 failed |
| `run_trigger_runtime_parity_tests.js` | 32 | 32 passed, 0 failed |
| `run_trigger_runtime_parity_cdp.py` | 16 | 16 passed, 0 failed |

Full suite: **347 passed, 0 failed**.

## Screenshots

`docs/screenshots/v07_5e/`

- `trigger-consumed-input-inspector.png` — Inspector open on a line where slot_b was consumed; trigger fired; provenance line visible.
- `trigger-omitted-input-not-fired.png` — Inspector open on a line where slot_b was *omitted*; "Selected but not rendered" section visible; no trigger fired.
- `mobile-375-trigger-run.png` — Mobile 375 px run view with generated lines.

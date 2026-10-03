# Import Fidelity — v07.5c

> **Historical document.** This page describes the v07.x legacy editor (frozen at v07.8, archived at https://taroke-remixer.theblackbirdfield.com/archive/v07.8/), not the current app. Chamber names, file behaviour and URLs here may differ from TAROKO REMIXER v1.0.4. For the current app see the [README](../README.md) and [What Is TAROKO REMIXER?](WHAT_IS_TAROKO_REMIXER.md).

## Problem

Imported projects with custom sample-bank IDs were silently contaminated with classic Taroko default banks (`above`, `below`, `trans`, `imper`, `intrans`, `texture`, `adjs`, `reserve`). Every import merged the classic bank set into the project, regardless of whether those banks were present in the imported file.

## Root defect

`migrateProject()` in `src/core.js` always called:

```javascript
rawTrays = Object.assign({}, base.materials.trays, p.materials.trays || p.dictionary || {});
```

This merged classic defaults into every imported project. If the imported file had custom banks only, the output had both classic and custom banks.

Similarly, `projectTrayDefs()` started from `Object.assign({}, TRAY_DEFS)`, so every call returned all eight classic banks regardless of the actual project.

## Migration contract (v07.5c)

| Input condition | Tray source |
|---|---|
| `materials.trays` present (even empty) | Exact imported tray set; no defaults injected |
| `dictionary` key present (legacy format) | Converted dictionary banks only; no defaults injected |
| Neither present | Classic default banks (`defaultProject()`) |

The same contract applies to `lineDevices`, `stanzaPatterns`, `flowScenes`, and `triggers`: if the key is present (even empty array), the imported value is used; if absent, the default is used.

## Additional fixes

- **`projectTrayDefs()`** now returns only the banks actually present in the project.
- **`bankMeta`** is built only from actual project trays; classic banks are never injected.
- **Token ID repair**: cross-bank duplicate IDs are detected and repaired with provenance recorded in `meta.importRepairs`.
- **Migration idempotency**: `meta.importRepairs` is cleared before each pass so double-migration produces no spurious repairs.
- **Editor state (`ui.tray`)**: on import and restore, `ui.tray` is set to the first valid imported bank (via `firstValidTray()`), never a hardcoded classic bank name.
- **New-object creation**: adding a new device, trigger, or input slot references the first valid imported bank, not `above` or `reserve`.
- **Bank deletion**: blocked if the bank is referenced by any device or trigger; blocked if it is the last bank. No `reserve` injection on delete.
- **Role selectors**: `adverb` and `preposition` added to the role dropdown in the Samples editor.

## Test evidence

```
./tests/run_all_tests.sh
240 passed, 0 failed
```

Suites added in this pass:
- `tests/run_import_fidelity_tests.js` — 30 JS unit tests
- `tests/run_import_fidelity_cdp.py` — 30 browser CDP tests

Fixtures:
- `tests/fixtures/exact_custom_banks_project.taroke.json` — 6 custom banks, intentional duplicate token IDs, devices and triggers referencing custom banks
- `tests/fixtures/legacy_dictionary_project.json` — legacy `dictionary`/`lineMachines`/`rareEvents` format
- `tests/fixtures/explicit_empty_collections_project.json` — explicitly empty `lineDevices`, `stanzaPatterns`, `flowScenes`, `triggers`

## Screenshots

See `docs/screenshots/v07_5c_import/` for:

| File | Description |
|---|---|
| `default-classic-banks-samples.png` | Default project with classic banks (before import) |
| `custom-import-samples-first-bank.png` | After import: first custom bank selected, no classic banks present |
| `custom-import-long-bank-list.png` | Full custom bank list visible |
| `custom-import-device-bank-selector.png` | Device editor showing only custom bank options |
| `custom-import-role-adverb-preposition.png` | Relations bank showing adverb role selector |
| `custom-import-no-classic-contamination.png` | Samples step with no classic bank tabs present |
| `mobile-375-custom-import-samples.png` | Mobile 375px: samples after custom import |
| `mobile-375-custom-import-devices.png` | Mobile 375px: devices step after custom import |

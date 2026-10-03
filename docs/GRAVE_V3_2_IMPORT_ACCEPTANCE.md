# Grave v3.2 Import Acceptance — v07.5c-r

> **Historical document.** This page describes the v07.x legacy editor (frozen at v07.8, archived at https://taroke-remixer.theblackbirdfield.com/archive/v07.8/), not the current app. Chamber names, file behaviour and URLs here may differ from TAROKO REMIXER v1.0.4. For the current app see the [README](../README.md) and [What Is TAROKO REMIXER?](WHAT_IS_TAROKO_REMIXER.md).

## File

**Filename:** `grave_v3_2_remixer_compatible_r2.taroke.json`
**SHA-256:** `2f4f9897581ba7c0afb4ddb6f25ac61e3ef7b15c6bb7289492075cbae697fd98`
**Schema version:** `0.7-reset`
**Author:** Mozare — *Grave v3.2 — constrained agency*

---

## Structural Inventory (pre-migration)

| Item | Count |
|------|-------|
| Tray count | 33 |
| Total tokens | 270 |
| Distinct bankMeta roles | noun, adjective, verb, adverb, preposition, mixed |
| Device count | 6 |
| Total device inputs | 54 |
| Total routes | 28 |
| Stanza count | 3 |
| Total stanza slots | 16 |
| Flow-scene count | 3 |
| Trigger count | 3 |
| Enabled triggers | 0 |
| Form override count | 11 |
| Note count | 0 |
| Duplicate token IDs | 61 unique IDs with multiple occurrences |
| Total duplicate occurrences (repairs) | 80 |
| Blank/missing token IDs | 0 |
| Ambiguous form override refs (dup IDs) | 0 |
| Ambiguous note linkedTokenIds | 0 |
| Invalid device tray refs (raw) | 0 |
| Invalid stanza device refs (raw) | 0 |
| Invalid scene stanza refs (raw) | 0 |
| Invalid trigger tray refs (raw) | 0 |

### Ordered tray keys

```
 [0] processed_bodies      (12 tokens)
 [1] document_objects      (11 tokens)
 [2] room_objects          (16 tokens)
 [3] scene_objects         (16 tokens)
 [4] body_sites             (7 tokens)
 [5] body_textures          (8 tokens)
 [6] document_textures     (10 tokens)
 [7] room_textures          (9 tokens)
 [8] scene_textures         (8 tokens)
 [9] wound_textures         (8 tokens)
[10] worker_agents          (7 tokens)
[11] office_agents         (13 tokens)
[12] room_agents           (10 tokens)
[13] force_agents          (10 tokens)
[14] labor_verbs           (10 tokens)
[15] office_verbs          (11 tokens)
[16] room_verbs            (11 tokens)
[17] force_verbs           (11 tokens)
[18] wound_verbs            (9 tokens)
[19] position_verbs         (7 tokens)
[20] conversion_verbs       (4 tokens)
[21] motion_verbs           (5 tokens)
[22] arrival_verbs          (6 tokens)
[23] quantity               (5 tokens)
[24] mass_object            (9 tokens)
[25] mass_singular          (7 tokens)
[26] mass_plural            (5 tokens)
[27] pressure_texture       (6 tokens)
[28] relations              (7 tokens)
[29] admin_relations        (6 tokens)
[30] reserve                (0 tokens)
[31] quantity_plural        (3 tokens)
[32] quantity_singular      (3 tokens)
```

### Duplicate token ID examples (61 IDs, 80 repairs)

The artwork intentionally reuses semantic IDs across different role-grouped banks
(e.g. `tok_wet` appears in body\_textures, document\_textures, scene\_textures,
wound\_textures, and pressure\_texture with the same literal "wet").
The full list was printed by the acceptance runner; a representative sample:

| ID | Banks |
|----|-------|
| tok_wet | body\_textures, document\_textures, scene\_textures, wound\_textures, pressure\_texture (5 occurrences → 4 repairs) |
| tok_file | document\_objects, office\_agents, office\_verbs, mass\_singular (4 → 3) |
| tok_record | document\_objects, office\_agents, office\_verbs, mass\_singular (4 → 3) |
| tok_return | labor\_verbs, wound\_verbs, motion\_verbs, arrival\_verbs (4 → 3) |
| tok_open | wound\_textures, office\_verbs, room\_verbs, wound\_verbs (4 → 3) |
| tok_flood | scene\_objects, force\_agents, mass\_object, mass\_singular (4 → 3) |
| tok_paper | document\_objects, mass\_object, mass\_singular (3 → 2) |

No form overrides or note links reference any of the duplicate IDs, so
there are zero ambiguous references.

---

## Migration Acceptance Results

Test command:
```bash
node tests/run_real_project_acceptance.js /path/to/grave_v3_2_remixer_compatible_r2.taroke.json
```

| # | Check | Result |
|---|-------|--------|
| 1 | Ordered tray keys unchanged | PASS |
| 2 | No unauthored classic bank injected | PASS |
| 3 | No authored bank disappears | PASS |
| 4 | Per-bank token counts unchanged | PASS |
| 5–9 | Token order / literals / roles / weights / locks | PASS |
| 10 | BankMeta labels, roles, descriptions unchanged | PASS |
| 11 | Devices reference valid banks after migration | PASS |
| 12 | Stanzas reference valid devices | PASS |
| 13 | Scenes reference valid stanzas | PASS |
| 14 | Triggers reference valid banks | PASS |
| 15 | Forms overrides not discarded (11 overrides) | PASS |
| 16 | Notes not discarded (0 notes) | PASS |
| 17 | No authored token lost (270 tokens) | PASS |

---

## Duplicate-ID Acceptance

| # | Check | Result |
|---|-------|--------|
| 1 | Repair count matches total duplicate occurrences (80) | PASS |
| 2 | Every repair has complete provenance | PASS |
| 3 | Unique IDs unchanged by repair | PASS |
| 4 | Repaired IDs are stable and bank-scoped | PASS |
| 5 | Repair IDs are deterministic across runs | PASS |

### Idempotency (m1 → m2 → m3)

| # | Check | Result |
|---|-------|--------|
| 1 | m2 deep-equals m3 | PASS |
| 2 | importRepairs stable m2→m3 | PASS |
| 3 | No new repairs on re-migration | PASS |
| 4 | Repaired IDs unchanged in m2 | PASS |

---

## Reference Ambiguity

All 11 form overrides in the artwork reference IDs that are unique in their source
bank (not duplicate IDs). Therefore there are **zero ambiguous override references**.

Result: **no ambiguous references — no artistic intent to invent**.

---

## JSON Round-Trip

| Check | Result |
|-------|--------|
| Tray keys preserved | PASS |
| Token count preserved (270) | PASS |
| importRepairs count stable (80) | PASS |
| materials deep-equal after round-trip | PASS |

---

## HTML Round-Trip

| Check | Result |
|-------|--------|
| Tray keys preserved | PASS |
| Token count preserved (270) | PASS |
| importRepairs count stable (80) | PASS |
| materials deep-equal after round-trip | PASS |

---

## Browser Acceptance

Test command:
```bash
python3 tests/run_real_grave_acceptance_cdp.py /path/to/grave_v3_2_remixer_compatible_r2.taroke.json
```

**Result: 30 passed, 0 failed**

| # | Check | Result |
|---|-------|--------|
| 1 | Import succeeds without crash | PASS |
| 2 | Samples: no unauthored classic bank present | PASS |
| 3 | Samples: opens on real Grave bank | PASS |
| 4 | Samples: all 33 authored banks present | PASS |
| 5 | Samples: bank order matches source file | PASS |
| 6 | Samples: custom bankMeta labels visible | PASS |
| 7 | BankMeta: authored roles preserved (noun/verb/adj/adv/prep) | PASS |
| 8 | Devices: no classic bank in device editor | PASS |
| 9 | Devices: all device inputs reference valid Grave banks | PASS |
| 10 | Triggers: no classic bank in trigger selector | PASS |
| 11 | New device: uses actual Grave bank | PASS |
| 12 | New trigger: uses actual Grave bank | PASS |
| 13 | Bank deletion: referenced bank deletion is blocked | PASS |
| 14 | Run: produces line events from Grave banks | PASS |
| 15 | Run: no blank line surfaces | PASS |
| 16 | JSON export: exact tray order preserved | PASS |
| 17 | JSON export: no classic banks injected | PASS |
| 18 | JSON export: importRepairs present (80) | PASS |
| 19 | HTML export: exact tray order preserved | PASS |
| 20 | HTML export: importRepairs preserved (80) | PASS |
| 21 | Autosave: tray keys preserved in draft | PASS |
| 22 | Autosave: importRepairs preserved in draft | PASS |
| 23 | Autosave restore: exact tray order preserved | PASS |
| 24 | Autosave restore: no classic contamination | PASS |
| 25 | Autosave restore: importRepairs survives restore | PASS |
| 26 | No uncaught console errors | PASS |
| 27 | Mobile 375×667: no horizontal overflow | PASS |
| 28 | 390×844: no horizontal overflow | PASS |
| 29 | 430×932: no horizontal overflow | PASS |
| 30 | 1440×900: no horizontal overflow | PASS |

---

## Autosave / Restore

Included in browser acceptance above (checks 21–25). Result: **PASS**.

---

## Trigger Compatibility Audit

### Artwork status

The artwork's `meta.compatibilityNote` records:
> "v07.5c-r: corrected accumulation grammar; removed duplicate textures; disabled triggers by
>  default because current core applies triggers to selected but non-rendered inputs."

All 3 triggers in the artwork have `enabled: false`.

### Audit procedure

A cloned in-memory project was constructed with:
- A multi-input device (PROCESSING, 9 inputs)
- A route that renders only the `worker` slot
- A trigger watching `labor_verbs / carry` at 100% chance
- The `labor_verbs` tray forced to contain only "carry"

`generateEvent()` was called with a deterministic RNG.
The trigger fired and `[TRIGGER_FIRED]` appeared in the surface output.

### Result: CONFIRMED

**The trigger engine fires triggers from selected-but-non-rendered inputs.**
The artwork's workaround (disabling all triggers) is correct and should not be changed.

### Regression test

`tests/run_trigger_compatibility_regression.js` documents the defect with two tests:
1. Confirms trigger fires from a selected-but-non-rendered slot (PASS = defect confirmed)
2. Confirms trigger does NOT fire when the bank is not an input at all (PASS = correct behavior)

This file is **not included in run\_all\_tests.sh**. Run standalone:
```bash
node tests/run_trigger_compatibility_regression.js
```

### Next step

**v07.5e is required** to fix the trigger engine. Contract:
> Triggers must only fire if the triggering bank is an input slot **and** that slot
> is referenced in the selected route template.

---

## Screenshots

Captured to `docs/screenshots/v07_5c_real_grave/`:

| File | Description |
|------|-------------|
| `real-grave-samples-first-bank.png` | Samples: first bank selected after import |
| `real-grave-long-bank-list.png` | Samples: full 33-bank list visible |
| `real-grave-device-bank-selector.png` | Devices: only Grave banks in selector |
| `real-grave-run-output.png` | Run: resolved lines from Grave banks |
| `real-grave-mobile-375-samples.png` | Mobile 375×667: Samples step |

---

## Acceptance Runner

Path: `tests/run_real_project_acceptance.js`

Usage (path-driven, not embedded in run\_all\_tests.sh):
```bash
node tests/run_real_project_acceptance.js /path/to/project.taroke.json
```

Covers: structural inventory, migration acceptance (17 checks), duplicate-ID repair,
idempotency (m1→m2→m3), reference ambiguity, JSON round-trip, HTML round-trip,
trigger compatibility audit.

---

## Test Suite

```
./tests/run_all_tests.sh
```

| Suite | Count |
|-------|-------|
| Core/static | 14 passed |
| Core extended | 38 passed |
| Import fidelity (JS) | 35 passed |
| Browser functional CDP | 16 passed |
| User-notes regression | 10 passed |
| Route-template regression | 5 passed |
| CDP deep QA | 50 passed |
| Accessibility/CDP hardening | 28 passed |
| Autosave/recovery CDP | 19 passed |
| Import fidelity CDP | 30 passed |
| **Total** | **245 passed, 0 failed** |

---

## Blockers and Non-Blockers

| Item | Type | Action |
|------|------|--------|
| Trigger fires from non-rendered input | Non-blocker (defect documented, artwork disables triggers as workaround) | v07.5e required |
| Real Grave import fidelity | CLEARED | All 32 JS acceptance checks + 30 browser checks pass |
| JSON round-trip | CLEARED | materials deep-equal after round-trip |
| HTML round-trip | CLEARED | materials deep-equal after round-trip |
| Autosave / restore | CLEARED | 5 checks pass |
| importRepairs provenance | CLEARED | 80 repairs, stable m2→m3, survives JSON/HTML/autosave |

**All import-integrity blocking checks PASS. Real-Grave acceptance is complete.**

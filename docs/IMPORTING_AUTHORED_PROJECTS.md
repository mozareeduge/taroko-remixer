# Importing Authored Projects

TAROKE REMIXER can import existing project files and preserve their authored structure exactly. This document describes the import contract, supported file formats, and what to expect when importing real artwork.

---

## Import contract

The migration layer applies the following authority rules:

1. **`materials.trays` is authoritative.** If the imported project contains an explicit `materials.trays` object (even an empty one), its exact tray set is used. No classic Taroko defaults are injected.

2. **`dictionary` is authoritative when modern trays are absent.** Legacy projects using the old `dictionary` / `lineMachines` / `rareEvents` format are converted to the modern structure using the dictionary's banks only. No defaults are injected.

3. **Classic defaults apply only when tray structures are absent.** If neither `materials.trays` nor `dictionary` is present, the classic default banks are used — same as a new project.

4. **Explicit empty collections remain empty.** An explicitly empty `materials.trays: {}`, `lineDevices: []`, `stanzaPatterns: []`, `flowScenes: []`, or `triggers: []` is preserved as empty. These are treated as authored states, not missing values.

5. **Custom bank IDs, order, labels, descriptions, and roles survive import.** The exact tray key order from the source file is maintained.

6. **Extended roles are supported.** Banks with roles such as `adverb` and `preposition` are preserved and displayed correctly in the bank editor.

7. **Imported editor selection moves to a valid actual bank.** After import, the editor selects the first valid bank from the imported project's actual tray set — never a hardcoded classic bank name like `above` or `reserve`.

8. **New devices, inputs, and triggers use actual project banks.** Adding a new device input or trigger after import references the first valid imported bank, not a classic default.

9. **The editor does not silently create `above` or `reserve`.** Classic bank IDs are not injected by the editor when working with a custom-bank project.

10. **Referenced banks cannot be deleted until references are rerouted.** Attempting to delete a bank that is referenced by any device input or trigger shows a blocking message. Reroute the references first.

11. **The last bank cannot be deleted.** At least one bank must remain in the project.

12. **Duplicate token IDs are repaired deterministically.** Cross-bank duplicate IDs (two tokens across different banks sharing the same `id` field) are detected and renamed with a suffix. The first occurrence retains the original ID; subsequent occurrences receive suffixed IDs (`_dup2`, `_dup3`, etc.).

13. **Repair provenance is stored in `meta.importRepairs`.** Each repair is recorded with the original ID, the assigned replacement, and the bank where it occurred. This record survives JSON and HTML round-trips.

14. **Ambiguous references cannot always be interpreted as artistic intent.** When an artwork intentionally reuses semantic IDs across banks, the deterministic repair preserves the first-occurrence reference. If a form override or note link pointed to a duplicate ID, it retains the first-occurrence binding after repair.

15. **JSON, HTML, and autosave round trips preserve authored banks.** Exporting to JSON or standalone HTML and reimporting produces the same bank structure. Autosave and restore preserve the imported project.

---

## Real Grave v3.2 acceptance

TAROKE REMIXER has been verified against a real authored project, Grave v3.2 (Mozare, *Grave v3.2 — constrained agency*), with the following characteristics:

| Item | Count |
|------|-------|
| Trays | 33 |
| Total tokens | 270 |
| Duplicate token ID occurrences repaired | 80 |
| Token loss | 0 |
| Classic-bank contamination | 0 |

The import completed correctly: all 33 trays with their authored IDs, labels, roles, and token counts were preserved. No classic Taroko banks (`above`, `below`, `trans`, etc.) were injected. Duplicate IDs were repaired deterministically with no token loss.

The actual artwork file is not distributed in this repository. See `docs/GRAVE_V3_2_IMPORT_ACCEPTANCE.md` for detailed evidence.

---

## Supported import formats

- **`.taroke.json`** — a project JSON file exported from TAROKE REMIXER. The authoritative editable project format.
- **Standalone `.taroke.html`** — a playable HTML artifact exported from TAROKE REMIXER. The editor extracts the embedded project JSON from these files when the file includes it.

Import files that do not match these formats, or that use unknown future schema versions, may not import correctly. Unknown schemas are not silently accepted; import fails with an error message rather than partially loading.

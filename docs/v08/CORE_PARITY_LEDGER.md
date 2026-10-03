# TAROKO v08 — Core Parity Ledger

Tracks which v07 `core.js` behaviours have been ported to `packages/core`
and verified at the unit level. Updated each WP that touches core logic.

---

## Schema version policy

| Constant | Value | Written to exported JSON? |
|----------|-------|--------------------------|
| `SCHEMA_VERSION` | `"0.7-reset"` | Yes — preserves v07 round-trip compatibility |
| `EDITOR_VERSION` | `"0.8.0"` | No — internal tracking only |
| `V07_SCHEMA_VERSION` | `"0.7-reset"` | Reference alias |

**Rule:** `schemaVersion` in any exported `.taroke.json` file must equal
`"0.7-reset"` until a deliberate breaking schema migration is approved by
the design authority. This allows v07 users to re-import files produced
by v08.

---

## WP02 — Core schema port (packages/core + packages/schema)

**Status:** IN PROGRESS  
**Branch:** `claude/v08-wp02-core-schema-recovery`

### Ported behaviours

| # | v07 function | v08 equivalent | Unit test | Notes |
|---|-------------|----------------|-----------|-------|
| 1 | `migrateProject()` | `packages/core/src/migration.ts` | `migration.test.ts` | A/B/C import paths, dup-ID repair |
| 2 | `defaultProject()` | `defaultProject()` in migration.ts | `migration.test.ts` | All tray defs, classic line devices, triggers |
| 3 | `validateProject()` | `validateProject()` in migration.ts | `migration.test.ts` | Required-field + tray-name checks |
| 4 | Token form generation | `packages/core/src/forms.ts` | `forms.test.ts` | Plural, singular, thirdSingular, past, uppercase |
| 5 | Line generation / weighting | `packages/core/src/generation.ts` | `generation.test.ts` | Weighted random, template interpolation |
| 6 | Tray selection helpers | `packages/core/src/selection.ts` | (inline in generation tests) | getTrayTokens, getDevice, getStanza |
| 7 | Export to JSON | `packages/core/src/export.ts` | `export.test.ts` | Round-trip: export → reimport → same tokens |
| 8 | User notes field | `notes` field on TarokoProject | (schema type test) | Preserved from v07 |
| 9 | Irregular plurals / verb forms | `IRREGULAR_PLURALS`, `IRREGULAR_VERB3` in schema | `forms.test.ts` | Same word-lists as v07 |
| 10 | F-end exception set | `F_END_EXCEPTIONS` in schema | `forms.test.ts` | Same set as v07 |

### Not yet ported (WP02 scope limit)

| Item | Target WP |
|------|-----------|
| Autosave/localStorage | WP03 |
| Route variable palette UI | WP05 |
| Accessible reorder | WP04 |
| Surface rendering (Taroko stream, etc.) | WP05+ |

---

## Import receipt format

When `migrateProject()` repairs imported data it writes to `meta.importRepairs`:

```json
{
  "meta": {
    "importedAt": "ISO-timestamp",
    "sourceSchemaVersion": "0.7-reset",
    "importRepairs": ["reassigned duplicate token ID tok_dup → tok_xxx"]
  }
}
```

This receipt must survive a round-trip export and re-import.

---

*Add rows to the WP02 table as tests are added. Do not mark a behaviour
ported until a unit test actually exercises it.*

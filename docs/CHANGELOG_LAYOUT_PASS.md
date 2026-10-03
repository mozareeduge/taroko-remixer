# v07 layout-pass changelog

> **Historical document.** This page describes the v07.x legacy editor (frozen at v07.8, archived at https://taroke-remixer.theblackbirdfield.com/archive/v07.8/), not the current app. Chamber names, file behaviour and URLs here may differ from TAROKO REMIXER v1.0.4. For the current app see the [README](../README.md) and [What Is TAROKO REMIXER?](WHAT_IS_TAROKO_REMIXER.md).

Fixed from user screenshots:

- Repaired route slot chip insertion. The previous parser split `data-insert-token` by `:`, so `{3:literal}` could be truncated into `{3`. Slot values are now separate data attributes.
- Removed surface theme controls.
- Removed surface family cards.
- Removed visible line numbers from run preview and exported artifacts.
- Kept internal event IDs for notes/recipe inspection only.
- Improved route template editing: larger textarea, clearer text-field/schema description, slot chips insert at cursor.
- Improved spacing: larger panel padding, wider device editor, wider route lanes, more button gaps, detached modal proportions.
- Hardened exported standalone runtime so regex backslashes survive export; previous exported runtime could degrade `\s` into `s`.
- Imported old projects now migrate to no visible ticks and plain taroko stream.

Verification:

- `./tests/run_all_tests.sh`: 45 passed, 0 failed.
- Additional Node check on `mumblings.taroko` import/export: no doubled commas, no unresolved `{...}` variables, no exported `<span class="tick">`.

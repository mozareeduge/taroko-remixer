# 00 — Master Charter

## Mission

Rebuild the TAROKO REMIXER editor as a stable, legible, responsive poetic signal workstation while preserving the tested generator, migration, import/export, standalone artifact, and authored-project fidelity of v07.8.

The rebuild must solve:

- stale edited values;
- scroll/focus/caret displacement;
- dropdown dismissal failures;
- false drag affordances;
- excessive simultaneous fields;
- selection spatially separated from its editor;
- route-variable chip walls;
- confusion among repetition, relative weight, and chance;
- role-insensitive Forms;
- dense Devices, Patterns, Flow, and Triggers;
- ambiguous import outcomes;
- weak procedural visibility.

## Product thesis

TAROKO is a visible-constraint authoring instrument. The user configures a procedural poem rather than asking a hidden system to write one.

Visible path:

`source → bank → sample → form → device input → route → pattern → scene → trigger → surface line → take/export`

The poetic Surface remains distinct from the apparatus.

## Rebuild boundary

Replace the editor UI and editor-state architecture.

Preserve or port with behavioral equivalence:

- project schema and migrations;
- exact custom bank IDs/order;
- duplicate-ID repair/provenance;
- generation semantics;
- consumed-input trigger semantics;
- JSON and HTML;
- standalone artifact runtime;
- autosave/recovery;
- real Grave acceptance;
- v07.8 public root until cutover.

## Committed capabilities

1. Master–detail editor and stable selection.
2. Grouped IA, not eleven equal tabs.
3. Desktop workspace and independently designed mobile chambers.
4. Clear relative weight versus chance.
5. Role-aware Forms.
6. Contextual route-variable insertion.
7. Accessible reorder: pointer, touch, keyboard, explicit Move commands.
8. WHEN → THEN triggers.
9. Persistent transport.
10. Cue for local audition.
11. Surface for the active whole.
12. Monitor and Unmix Line.
13. Takes.
14. Transactional undo/redo.
15. Exact JSON/HTML/autosave compatibility.
16. Static GitHub Pages deployment.

## Reserved extensions

Do not implement in the parity rebuild unless separately approved:

- scene crossfades, carry, echo;
- generalized automation beyond current trigger actions;
- collaboration/cloud;
- AI generation;
- MIDI/audio;
- plugin marketplace;
- schema-breaking new concepts.

## Truth conditions

1. Imported authored banks are authoritative.
2. Unknown fields are preserved unless explicitly migrated.
3. Editor and artifact runtime agree.
4. Triggers use only consumed material.
5. JSON is archive authority.
6. Autosave is recovery, not archive.
7. v07 root stays until release.
8. No old test removed without mapped replacement.
9. No control may imply behavior it lacks.
10. Drag always has a non-drag alternative.
11. Mobile is not compressed desktop.
12. No cloud dependency.

## Program shape

A lead Claude session may use an agent team or dynamic workflow, but each work package has:

- isolated ownership/worktree;
- test-first acceptance;
- fresh-context review;
- merge gate;
- rollback boundary.

## Human involvement

Only two mandatory user checkpoints:

1. complete vertical slice under `/next/`;
2. release candidate before root cutover.

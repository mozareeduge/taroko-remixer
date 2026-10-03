# TAROKO REMIXER — Claude Code Rules

Project type: static local-first browser app. No framework, no build step.

Run target: `index.html` at repository root.

Core files:
- `index.html`: app shell only.
- `styles.css`: black/white functional workbench styling.
- `src/core.js`: project model, generator, migration, export/import.
- `src/app.js`: DOM rendering and editor interactions.
- `tests/`: executable regression tests.

Hard rules:
- Keep the project light: no framework, bundler, database, server, or new dependency unless explicitly requested.
- Do not redesign aesthetics. Keep black/white monospace workbench.
- Do not reintroduce surface theme cards or surface family cards.
- Do not reintroduce visible line numbers in run/export surfaces.
- Preserve local-first import/export: `.taroke.json` and standalone `.taroke.html` must keep working.
- Route templates are text-field/variable schemas. Slot chips must insert complete `{slot:form}` variables at the cursor.
- Missing variables must not leave doubled punctuation such as `,,`.
- Every editable layer must be user-editable: samples, forms, devices, stanza, flow, triggers, surface numbers, run notes, export.

Workflow:
- For small fixes, patch directly and run targeted tests.
- For multi-file changes, inspect first, write a compact plan, then implement.
- Always run `./tests/run_all_tests.sh` before claiming done. Expected: 534 passed, 0 failed.
- Show evidence: changed files and test output.
- If two attempts fail, stop, summarize root cause, and restart from a clean plan.
- One session = one bounded task. See `docs/CLAUDE_WORKFLOW.md` for phase order.

Skills (repeatable procedures):
- `.claude/skills/qa-evidence/SKILL.md` — acceptance evidence checklist
- `.claude/skills/release-check/SKILL.md` — pre-merge checklist
- `.claude/skills/feature-gate/SKILL.md` — feature plan template

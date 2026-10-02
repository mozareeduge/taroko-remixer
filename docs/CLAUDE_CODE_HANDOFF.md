# Claude Code Handoff — TAROKE REMIXER

Objective: continue TAROKE REMIXER in `https://github.com/mozareeduge/taroke-remixer` with minimum user back-and-forth and maximum autonomous verified sessions.

Current baseline: v07 layout-pass. It is a functional static app, not a design/aesthetic phase.

Immediate rule: do not expand features until the current baseline is committed and deployed on GitHub Pages.

## Session 1 — Repository landing and Pages readiness

Use this prompt in Claude Code from the repository root:

```text
Inspect this repo. Bring in the current TAROKE REMIXER static app if it is not already present. Keep it light: no framework, no build step, no new dependencies. The app must run from root index.html on GitHub Pages. Ensure .nojekyll exists. Run ./tests/run_all_tests.sh. Fix only blocking issues. Commit with message: "Land v07 layout-pass static workbench". Report changed files and test output only.
```

Verification: root `index.html` opens app; tests pass; Pages can publish from main/root.

## Session 2 — Issue discipline only after deployment

```text
Read CLAUDE.md and README.md. Do not redesign aesthetics. Review the current app against this checklist: route template chip insertion, missing-slot punctuation cleanup, sample bank movement, sample duplication/weighting, device editability, stanza editability, flow selection, trigger sample dropdown, no surface cards, no visible line numbers, export/import roundtrip. Run tests. If a failure exists, fix minimal diff only. Commit only after tests pass.
```

## Constraints to preserve

- Static app only.
- Black/white monospace workbench.
- No line numbers on poem output.
- No surface theme/family card UI.
- Slot chips insert full variables at cursor.
- Import/export must survive old `.taroke.html` and `.taroke.json` files.
- Tests are the stop condition.

## Later backlog, not now

- Better mobile layout after GitHub Pages is live.
- Additional export templates only after the base stream is stable.
- Optional visual aesthetics only after functional editing is complete.

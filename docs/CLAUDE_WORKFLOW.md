# TAROKE REMIXER — Claude Code Workflow

This document explains how Claude Code sessions are structured for this project
and how Mohammad (the project owner) interacts with them.

---

## One session = one bounded task

Each Claude Code session handles exactly one named task:
a bug fix, a release pass, a QA evidence run, or a docs update.
Do not pile multiple tasks into a single session.

Start a fresh session for each phase. Do not paste long chat history from a
prior session into a new one; the prior session's commits are the record.

---

## Phase order for a release pass

1. **Feature/fix session** — implement the change on a feature branch.
2. **QA evidence session** — run `/qa-evidence` to produce the acceptance doc.
3. **Release-check session** — run `/release-check` before merging to `main`.
4. **Merge** — merge the branch via GitHub (PR or direct merge).
5. **Docs sync session** (if needed) — update README, TEST_REPORT, public docs.

Fresh session between phases. Each session commits and pushes before ending.

---

## Verification

Tests and screenshots are the verification record, not chat text.

After any change:

```bash
./tests/run_all_tests.sh
```

Expected result is stated in `README.md` and `TEST_REPORT.md`.
If the count changes, update both files before merging.

For visual changes, capture screenshots to `docs/screenshots/` and include
them in the acceptance evidence doc.

---

## No redesign without issue approval

Do not change the visual design of the app without a filed GitHub issue labeled
`redesign` that has been reviewed and approved by Mohammad.

The current design constraint is: **black/white monospace workbench**.
Specifically forbidden without approval:
- Surface theme controls
- Surface family cards
- Visible line numbers in run or export surfaces
- Any color palette beyond black/white

---

## No new dependencies without explicit reason

This is a zero-dependency static app. Do not add:
- npm packages
- CDN script imports
- Python packages beyond `requests` and `websocket-client` (test-only)
- Any build step

If a task genuinely requires a new dependency, file an issue explaining why
before adding it.

---

## How to run tests

```bash
# From the repository root:
./tests/run_all_tests.sh
```

Browser tests require Chromium available as `chromium` or `chromium-browser`
plus Python packages `requests` and `websocket-client`:

```bash
pip3 install websocket-client
```

---

## How to check and publish GitHub Pages

1. Push `index.html`, `styles.css`, `src/`, and `.nojekyll` to `main` root.
2. In GitHub repository Settings → Pages, set source to `main` branch, root.
3. Live URL: `https://mozareeduge.github.io/taroke-remixer/`
4. Allow 1–3 minutes for Pages to build after each push.

If the live URL is blocked by network policy in a Claude Code remote session,
record it honestly in the evidence doc:

> Live URL check: BLOCKED (network policy). Local check passed.

---

## How to report to Mohammad

At the end of each session, provide:

1. Files created or changed (with purpose).
2. Test command and result (exact count).
3. Commit hash.
4. Blockers or open questions (if any).

No narrative padding. Short, factual, actionable.

---

## Current release train

| Pass      | Status           | Branch / commit                          |
|-----------|------------------|------------------------------------------|
| v07.2     | Merged to main   | `f01e429`                                |
| v07.3     | Merged to main   | `650640b`                                |
| v07.4     | Merged to main   | `4ee5e05`                                |
| v07.5     | Merged to main   | `20c923c`                                |
| v07.5c    | Merged to main   | acceptance pass — 245 passed, 0 failed — `eebc98d` + acceptance corrections `c3c47d8` |
| v07.5c-r  | Merged to main   | real-Grave acceptance — 245 passed, 0 failed — trigger defect CONFIRMED |
| v07.5d    | Merged to main   | interaction continuity — 296 passed, 0 failed — `444321e` |
| v07.5e    | Merged to main   | rendered-input trigger parity — 347 passed, 0 failed — `20c3afa` / certification `2b9ebd1` |
| v07.6     | Merged to main   | live embedded artifact preview — 415 passed, 0 failed — `a5237bc` / merge `4dc6067` / workflow `e636dd9` |
| v07.7     | Merged to main   | public documentation packet — 520 passed, 0 failed — `bd8a78e` / merge `e145603` |
| v07.8     | Release checkpoint complete | release verification, iframe preservation fix, metadata — `claude/v07-8-release-checkpoint` |
| Future    | Issue-based development | post-v07 changes tracked via GitHub issues |
| `0921001` | Superseded prototype | never directly merged — inspected as reference only on `claude/artifact-preview-iframe-uqm74k` |

Each pass targets a specific named scope. Do not mix scopes within a pass.

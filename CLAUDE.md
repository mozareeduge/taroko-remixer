# TAROKO REMIXER

- The **live app** is v1.0.3 (`next2/index.html`), deployed to the site root and `/next2/`. It was
  promoted from `/next2/` to root on 2026-08-26.
- The **v07.8 legacy app** — `index.html`, `styles.css`, `src/` at the repository root — is frozen
  and archived: preserve its files and its accepted baseline (534 passed, 0 failed) exactly as-is.
  Its CI suite (`scripts/verify_v07_baseline.py`) still runs against those root-level files in
  place on every push; it is deployed (not served live) at `/archive/v07.8/`. Do not move, edit, or
  delete these files — the archive relies on them staying exactly where the test suite expects them.
- v08 is the React/TypeScript/Vite workbench under `apps/workbench` and `/next/`.
- The current user instruction or one ingested Project Relay workload is the only task authority.
- `docs/v08/control/`, former task files, former reviewer files, and former evidence ledgers are historical records, not executable instructions.
- Read only the active workload task and its named repository scope. Do not start subagents, agent teams, reviewers, background work, or repository-wide audits unless the active workload explicitly authorizes them.
- Run only the checks named by the active workload. Every long-running check must have a hard timeout; never rerun an unchanged failure.
- Mutable run state, logs, screenshots, and evidence belong under ignored `.claude/relay/run/`, not in candidate commits.
- After the authorized change and checks are complete, create at most one coherent commit and one PR, report the result, and stop. Never merge, deploy, or begin another workload implicitly.

# 09 — Master Claude Code Prompt

Paste into a fresh claude-sonnet-4-6 / medium-effort Claude Code session after placing this package at `docs/v08/program/`.

**Execution policy (correction requested by Mohammad, recorded in docs/v08/DECISIONS.md D-001):**
The complete program uses claude-sonnet-4-6 at medium effort. Do not escalate to higher models or effort levels for any reason.

---

TASK:
Execute the TAROKO REMIXER v08 hybrid editor rebuild as one coordinated multi-agent program composed of bounded, reviewed work packages.

Use a dynamic workflow or agent team. Do not implement the rebuild as one undifferentiated branch or one agent context.

REPOSITORY:
mozareeduge/taroko-remixer

IMMUTABLE BASELINE:
tag: v07.8-release-checkpoint
commit: f7183f01037bf963612d4b56561d3b8cdde306b5
baseline: 534 passed, 0 failed

PROGRAM AUTHORITY:
Read every file under `docs/v08/program/` in numeric order.

Also read:

- CLAUDE.md
- README.md
- TEST_REPORT.md
- docs/CLAUDE_WORKFLOW.md
- docs/RELEASE_CHECKPOINT_v07_8.md
- current core/app
- every test runner and fixture
- real Grave acceptance record.

Do not code before completing the program and test inventory.

PRIMARY DECISION:
Rebuild the editor with React + TypeScript + Vite. Preserve a pure TypeScript core and artifact runtime. Keep the v07.8 root public until final cutover. Publish accepted v08 previews under `/next/`.

PHASE A — BOOTSTRAP

1. Verify tag/commit.
2. Run full 534 baseline.
3. Create:
   - docs/v08/EXECUTION_DAG.md
   - docs/v08/TEST_MIGRATION_LEDGER.md
   - docs/v08/DECISIONS.md
   - docs/v08/RISK_REGISTER.md
   - docs/v08/STATUS.md
4. Validate `claude-assets` against the installed Claude Code version.
5. Install only validated agents, skills, hooks, and rules.
6. Define file/worktree ownership.
7. Continue without asking Mohammad to restate context.

PHASE B — TEAM

Create specialized agents equivalent to:

- baseline archivist
- domain/UX guardian
- compatibility engineer
- state architect
- UI foundation
- materials
- instruments
- composition
- automation
- performance
- archive
- test architect
- accessibility
- performance/security
- independent reviewer
- experience reviewer.

Use fresh-context Writer/Reviewer separation and worktrees. Do not permit concurrent edits to schema, root store, or global tokens without an integration owner.

PHASE C — EXECUTE WP00–WP13

For every package:

1. branch/worktree;
2. failing acceptance tests first where possible;
3. implementation;
4. targeted tests;
5. affected package tests;
6. applicable full suite;
7. run and inspect app;
8. screenshots/traces/evidence;
9. a11y/performance/security relevant checks;
10. fresh review;
11. fix findings;
12. rerun;
13. update decision log, ledger, status;
14. PR;
15. merge only after gate.

Never:

- merge P0/P1;
- delete an old test without mapped replacement;
- silently change schema;
- replace root v07 before WP13;
- patch selectors/screenshots to hide behavior.

PHASE D — ROOT CAUSE

reproduce
→ classify
→ instrument
→ minimal failing regression
→ root cause
→ smallest correct fix
→ targeted tests
→ full tests
→ running-app verification
→ evidence.

PHASE E — EXPERIENCE

At WP05 deploy `/next/` and prepare Human Checkpoint A. Stop only for Mohammad’s verdict.

Classify feedback as:

- correctness blocker;
- interaction blocker;
- domain-design conflict;
- aesthetic conflict;
- enhancement;
- preference.

Reproduce and revise design authority when required.

At WP12 prepare Human Checkpoint B. Do not cut over without explicit acceptance.

PHASE F — RELEASE

After acceptance:

- WP13;
- archive v07 at `/legacy/v07/`;
- deploy v08 root;
- full tests/live smoke;
- v07 JSON/HTML import;
- standalone artifact;
- rollback rehearsal;
- annotated tag through established GitHub Actions tagging method.

MODEL POLICY

claude-sonnet-4-6 at medium effort throughout. No escalation for architecture, domain, compatibility, integration, review, or release. All agents use model: claude-sonnet-4-6 and effort: medium. (Correction requested by Mohammad — see docs/v08/DECISIONS.md D-001.)

STATUS

Maintain `docs/v08/STATUS.md` so another session can resume.

Each merged package records:

- branch/PR/commit;
- tests;
- evidence;
- reviewer;
- non-blockers;
- next.

FINAL OUTPUT ONLY:

1. baseline
2. packages completed
3. final architecture
4. schema/compatibility
5. real Grave
6. runtime parity
7. interactions
8. Cue/Surface/Unmix/Takes
9. mobile
10. accessibility
11. performance/security
12. tests
13. human checkpoints
14. URLs
15. cutover
16. rollback
17. tag
18. post-v08 issues

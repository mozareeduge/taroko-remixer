# TAROKO REMIXER v08 — Decision Log

All decisions recorded here are implementation-layer decisions below the authored design specification in `docs/v08/program/`. They do not override the program authority.

Design decisions are fixed in `docs/v08/program/`. This log records execution, policy, and implementation decisions only.

---

## Format

```
ID:       D-NNN
Date:     YYYY-MM-DD
WP:       WP##
Category: execution-policy | architecture | test | tooling | correction
Author:   [session identifier or name]
Summary:  One sentence.
Context:  What forced the decision.
Decision: What was decided.
Rationale: Why.
Alternatives: What else was considered.
Effect:   What changes.
Review:   Who reviewed (if applicable).
```

---

## D-001 — Execution-policy correction: model and effort

**Date:** 2026-07-13  
**WP:** WP00  
**Category:** execution-policy correction  
**Author:** Mohammad (requested) / Program Lead (implemented)  
**Summary:** Replace all model-escalation language in committed program documents with the fixed execution policy: claude-sonnet-4-6 at medium effort throughout.

**Context:**  
The committed program documents (07_AGENT_ORCHESTRATION_AND_WORK_PACKAGES.md and 09_MASTER_CLAUDE_CODE_PROMPT.md) contained language referring to "strongest available model", "strongest-model lead", "highest effort", and "ultracode". The task initializer from Mohammad specifies that the complete program must use claude-sonnet-4-6 at medium effort. This is not a product decision; it is an execution-policy correction requested by Mohammad.

**Decision:**  
Correct the execution-policy language in 07 and 09:
- Replace "One strongest-model lead" → "One claude-sonnet-4-6 lead"
- Replace "Strongest model/highest effort" → "claude-sonnet-4-6 / medium effort"
- Remove "ultracode" references
- State: complete program uses claude-sonnet-4-6 at medium effort
- All custom agent definitions: use `model: claude-sonnet-4-6` and `effort: medium`
- Do not alter product, domain, interaction, aesthetic, or test decisions

**Rationale:**  
Mohammad specified this explicitly in the program initializer. The model policy is an execution parameter, not a product or design decision.

**Alternatives:**  
None — this is a direct instruction from Mohammad.

**Effect:**  
Program docs 07 and 09 updated. Agent definitions updated. No functional or product change.

**Review:**  
Requested by Mohammad. No independent review required for execution-policy correction.

---

## D-002 — CLAUDE.md: v07 rules preserved; v08 addendum added separately

**Date:** 2026-07-13  
**WP:** WP00  
**Category:** tooling  
**Author:** Program Lead  
**Summary:** The root CLAUDE.md is not replaced; a v08-specific addendum is added referencing the v08 template.

**Context:**  
The root CLAUDE.md governs the v07 codebase (static no-framework). The v08 program template (claude-assets/CLAUDE.md.template) targets the v08 rebuild workspace. Replacing the root CLAUDE.md would remove v07 governance during the rebuild, which is forbidden.

**Decision:**  
Keep the existing root CLAUDE.md unchanged for v07 rules. Install the v08 template content as `.claude/v08-rules.md` for reference within v08 work sessions. When WP13 cutover replaces the root, the CLAUDE.md will be replaced with the v08 version at that time.

**Alternatives:**  
- Replace CLAUDE.md now: rejected — removes v07 governance during rebuild
- Merge both into one file: rejected — creates ambiguity about which rules apply to which code

**Effect:**  
Root CLAUDE.md unchanged. `.claude/v08-rules.md` added.

---

## D-003 — npm workspaces as package manager

**Date:** 2026-07-13  
**WP:** WP01 (pending)  
**Category:** architecture  
**Author:** Program Lead  
**Summary:** Use npm workspaces per program document 04_TECHNICAL_ARCHITECTURE.md; no evidence exists to justify a different manager.

**Context:**  
Program doc 04 says "Use npm workspaces unless current evidence justifies another package manager." The existing project uses plain npm (package.json is present, no lock file for pnpm/yarn). No evidence justifies deviation.

**Decision:**  
Use npm workspaces for WP01.

**Alternatives:**  
- pnpm: slightly better disk performance but no justified need
- yarn: no benefit over npm for this project

**Effect:**  
WP01 workspace scaffolding uses npm workspaces.

---

*Additional decisions recorded as WPs progress.*

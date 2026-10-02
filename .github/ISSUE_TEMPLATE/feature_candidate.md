---
name: Feature candidate
about: Propose a new capability for TAROKO REMIXER
labels: feature-candidate
---

## User workflow

Describe the specific task or creative action the user wants to do.
Write it as a user story: "As a user, I want to … so that …"

## Why the current app cannot do it

Be precise. Name the specific gap in the current model or UI.
Do not file a feature request for something that already exists.

## Non-goals

List what this feature explicitly does NOT need to do.
This scopes the implementation and prevents creep.

## Smallest acceptable implementation

Describe the minimum change that delivers the workflow above.
Prefer adding to an existing editable layer over creating a new one.

## Tests required

List the specific new test assertions needed before this feature ships:

1. ...
2. ...

## Docs required

List which docs files must be updated when this ships:

- `README.md` (if functional scope changes)
- `TEST_REPORT.md` (always, with new count)
- `docs/ACCEPTANCE_EVIDENCE_v<VERSION>.md`

## Release phase candidate

Which release pass would this fit into? (e.g. v07.5, v07.6, or deferred)
Check the current release train in `docs/CLAUDE_WORKFLOW.md`.

# TAROKO Operating Model

This document describes the three separated modes of TAROKO development.
It is a standing reference; it does not authorize any specific work.

## Mode 1 — GPT/Human Specification

A human author, assisted by a GPT-class planning tool, compiles a Project Relay
workload package (a ZIP containing MISSION.md, tasks, authority, and verification
files). The workload defines exactly what must be built, which checks must pass,
and what a done state looks like. No implementation begins until the workload is
validated and explicitly ingested.

## Mode 2 — Bounded Claude Implementation

Claude Code ingests the workload package and executes its single named task
directly: reading only the files listed in the task's repository scope, running
only the checks named by the task, and stopping after one coherent commit and
one Draft PR. Claude does not start reviewers, subagents, background audits, or
additional tasks. It does not merge, deploy, or begin another workload. If a
required stop condition is met, it reports and halts.

## Mode 3 — Deterministic CI / Release

GitHub Actions CI runs on pull requests to `main` and on `main` pushes only.
Every job has an explicit timeout. Deployment to GitHub Pages is triggered only
by merges to `main` and requires no action from Claude or an automated agent.

## Invariants

- Reviewers, deployment, and next-work decisions are never automatic defaults.
- No hook, Stop gate, state machine, or CI polling is added by Claude.
- Human checkpoint approval is required before any merge or deployment.
- Mutable run state lives under `.claude/relay/run/` (git-ignored) and is never committed.

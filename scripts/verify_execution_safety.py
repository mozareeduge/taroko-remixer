#!/usr/bin/env python3
"""Verify TAROKO's lean Claude/Playwright/CI operating boundary."""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []

def require(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)

claude_path = ROOT / "CLAUDE.md"
require(claude_path.is_file(), "CLAUDE.md missing")
claude = claude_path.read_text(encoding="utf-8") if claude_path.is_file() else ""
require(len(claude.splitlines()) <= 20, "CLAUDE.md exceeds 20 lines")
for forbidden in (
    "RUN_STATE.json`.",
    "Continue through dependency-satisfied tasks",
    "fresh reviewers",
    "one user kickoff may span",
):
    require(forbidden.lower() not in claude.lower(), f"legacy autonomous instruction remains: {forbidden}")
require("historical records, not executable instructions" in claude, "historical control-plane boundary missing")
require(".claude/relay/run/" in claude, "ignored runtime-state boundary missing")

settings_path = ROOT / ".claude/settings.json"
if settings_path.is_file():
    settings = json.loads(settings_path.read_text(encoding="utf-8"))
    hooks = settings.get("hooks", {})
    require(not hooks, "project settings still define hooks")

legacy_agent_dir = ROOT / ".claude/agents"
if legacy_agent_dir.is_dir():
    non_relay_agents = [p.name for p in legacy_agent_dir.glob("*.md") if not p.name.startswith("relay-")]
    require(not non_relay_agents, f"legacy agents remain: {non_relay_agents}")

legacy_skill_dir = ROOT / ".claude/skills"
if legacy_skill_dir.is_dir():
    non_relay_skills = [p.name for p in legacy_skill_dir.iterdir() if p.is_dir() and not p.name.startswith("relay-")]
    require(not non_relay_skills, f"legacy skills remain: {non_relay_skills}")

require(not (ROOT / ".claude/hooks/teammate_gate.sh").exists(), "legacy TeammateIdle gate remains")

state_path = ROOT / "docs/v08/control/RUN_STATE.json"
require(state_path.is_file(), "historical RUN_STATE.json missing")
if state_path.is_file():
    state = json.loads(state_path.read_text(encoding="utf-8"))
    require(state.get("terminal_status") == "closed", "legacy RUN_STATE terminal_status is not closed")
    require(state.get("historical") is True, "legacy RUN_STATE is not marked historical")
    require(state.get("active_task") is None, "legacy RUN_STATE still has an active task")
    require(state.get("blocker") is None, "legacy RUN_STATE still records a blocker")

pw_path = ROOT / "apps/workbench/playwright.config.ts"
require(pw_path.is_file(), "Playwright config missing")
pw = pw_path.read_text(encoding="utf-8") if pw_path.is_file() else ""
for token in ("globalTimeout:", "maxFailures:", "actionTimeout:", "navigationTimeout:"):
    require(token in pw, f"Playwright circuit breaker missing: {token}")
require(re.search(r"reuseExistingServer:\s*false", pw) is not None,
        "Playwright certification must not reuse an arbitrary existing server")
require('trace: "retain-on-failure"' in pw or "trace: 'retain-on-failure'" in pw,
        "failure trace must be retained")
require('video: "off"' in pw or "video: 'off'" in pw, "video must be off by default")

ci_path = ROOT / ".github/workflows/ci.yml"
require(ci_path.is_file(), "CI workflow missing")
ci = ci_path.read_text(encoding="utf-8") if ci_path.is_file() else ""
require("claude/v08-*" not in ci, "feature-branch push trigger remains")
require("github.event.pull_request.number || github.ref" in ci,
        "CI concurrency does not unify PR and fallback refs")
e2e_jobs = re.findall(r"(?ms)^  (v08-e2e-[^:]+):\n(.*?)(?=^  [A-Za-z0-9_-]+:\n|\Z)", ci)
require(bool(e2e_jobs), "no E2E jobs found")
for name, body in e2e_jobs:
    require(re.search(r"(?m)^    timeout-minutes:\s*(?:2[0-9]|3[0-5])\s*$", body) is not None,
            f"{name} lacks a 20–35 minute job timeout")

gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8") if (ROOT / ".gitignore").is_file() else ""
require(".claude/relay/run/" in gitignore, ".claude/relay/run/ is not ignored")

if errors:
    print("TAROKE_EXECUTION_SAFETY_BLOCKED")
    for error in errors:
        print("-", error)
    raise SystemExit(1)

print("TAROKE_EXECUTION_SAFETY_PASS")

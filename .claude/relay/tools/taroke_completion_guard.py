#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, sys
from pathlib import Path

def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def evaluate(state, features):
    errors = []
    rows = features.get("features", [])
    incomplete = [f.get("id") for f in rows if f.get("status") != "done"]
    if incomplete:
        errors.append("incomplete features: " + ", ".join(incomplete))
    if state.get("terminal_status") != "ready_for_human_checkpoint":
        errors.append("terminal_status is not ready_for_human_checkpoint")
    candidate = state.get("current_candidate")
    ci = state.get("ci", {})
    if not candidate or ci.get("candidate") != candidate or ci.get("conclusion") != "success":
        errors.append("final candidate is not bound to successful CI")
    review = state.get("review", {})
    if review.get("candidate") != candidate or len(review.get("roles_passed", [])) < 3:
        errors.append("three fresh reviews do not certify the final candidate")
    if review.get("open_p0", 0) or review.get("open_p1", 0):
        errors.append("open P0/P1 findings remain")
    deploy = state.get("deployment", {})
    if deploy.get("candidate") != candidate or not deploy.get("root_verified") or not deploy.get("next_verified"):
        errors.append("public root and /next/ are not verified for the final candidate")
    return errors

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--state", default="docs/v08/control/RUN_STATE.json")
    ap.add_argument("--features", default="docs/v08/control/FEATURES.json")
    ap.add_argument("--hook", action="store_true")
    args = ap.parse_args()
    if args.hook:
        try:
            payload = json.load(sys.stdin)
        except Exception:
            payload = {}
        if payload.get("background_tasks") or payload.get("session_crons"):
            return 0
    state_path, features_path = Path(args.state), Path(args.features)
    if not state_path.is_file() or not features_path.is_file():
        msg = "TAROKO completion state is missing. Continue T00 and create the durable state files."
        print(msg, file=sys.stderr)
        return 2 if args.hook else 1
    state, features = load(state_path), load(features_path)
    terminal = state.get("terminal_status")
    if terminal in {"blocked", "paused_external_limit"}:
        return 0
    errors = evaluate(state, features)
    if errors:
        print("TAROKO WP05 completion gate is not satisfied:", file=sys.stderr)
        for e in errors:
            print("- " + e, file=sys.stderr)
        print("Active task: " + str(state.get("active_task")), file=sys.stderr)
        print("Next: " + str(state.get("next_exact_action")), file=sys.stderr)
        return 2 if args.hook else 1
    print("TAROKE_CHECKPOINT_A_READY")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

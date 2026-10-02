#!/usr/bin/env bash
set -euo pipefail
missing=0
for f in docs/v08/STATUS.md docs/v08/DECISIONS.md docs/v08/TEST_MIGRATION_LEDGER.md; do
  if [ ! -f "$f" ]; then
    echo "Missing required evidence: $f" >&2
    missing=1
  fi
done
[ "$missing" -eq 0 ] || exit 2
if [ -f package.json ]; then
  npm run typecheck --if-present >/tmp/taroko-typecheck.log 2>&1 || {
    cat /tmp/taroko-typecheck.log >&2
    exit 2
  }
fi

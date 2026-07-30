#!/usr/bin/env bash
# Fail if professional-repo junk is tracked or present in critical paths.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail=0

check_glob() {
  local label="$1"
  shift
  local matches
  matches="$(find . \
    \( -path './.git' -o -path './.git/*' \
       -o -path '*/node_modules/*' -o -path './node_modules' \
       -o -path '*/.next/*' -o -path './programs/target/*' \
    \) -prune -o \
    \( "$@" \) -print 2>/dev/null | head -50 || true)"
  if [[ -n "$matches" ]]; then
    echo "FAIL: $label"
    echo "$matches"
    fail=1
  fi
}

check_glob "Finder duplicate files (* 2*)" -name '* 2*'
check_glob "Backup files (*.bak)" -name '*.bak'
check_glob "Startup logs in backend" \( -path './backend/startup.err' -o -path './backend/startup.out' \)
check_glob "Legacy SPA entry" \( -path './frontend/App.tsx' -o -path './frontend/index.tsx' -o -path './frontend/index.html' \)
check_glob "Dual root types" -path './frontend/types.ts'
check_glob "Dual QueryProvider under components" -path './frontend/components/QueryProvider.tsx'

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  tracked_dist="$(git ls-files 'backend/dist' 'programs/target' '**/node_modules/**' 2>/dev/null || true)"
  if [[ -n "$tracked_dist" ]]; then
    echo "FAIL: build artifacts tracked by git"
    echo "$tracked_dist" | head -20
    fail=1
  fi
fi

if [[ "$fail" -ne 0 ]]; then
  echo "check-no-junk: failed"
  exit 1
fi

echo "check-no-junk: ok"

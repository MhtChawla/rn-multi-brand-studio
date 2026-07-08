#!/usr/bin/env bash
set -euo pipefail

FAILED=0

check() {
  local pattern="$1"
  local results
  results=$(grep -rn --include='*.ts' --include='*.tsx' -E "$pattern" app/ src/ 2>/dev/null \
    | grep -v '^src/theme/' || true)
  if [[ -n "$results" ]]; then
    echo "❌ Token leak pattern: $pattern"
    echo "$results"
    echo ""
    FAILED=1
  fi
}

check '#[0-9a-fA-F]{3,8}\b'
check 'rgba?\('
check 'hsla?\('
check 'fontSize\s*:'
check 'fontFamily\s*:'
check 'lineHeight\s*:'

if [[ $FAILED -eq 1 ]]; then
  echo "Fix: move all raw style values into src/theme/tokens.ts and consume via useTheme()"
  exit 1
fi

echo "✅ check:tokens passed — no raw style values outside src/theme/"

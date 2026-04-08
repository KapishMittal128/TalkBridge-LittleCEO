#!/usr/bin/env bash
# .agents/hooks/pre-commit.sh
# Lightweight pre-commit sanity checks.
# Designed to be fast and non-blocking for the workflow.
# Install: copy to .git/hooks/pre-commit and chmod +x

set -euo pipefail

echo "→ Running pre-commit checks..."

# ─────────────────────────────────────────────
# 1. Check for accidental secret file staging
# ─────────────────────────────────────────────
STAGED_FILES=$(git diff --cached --name-only)

for file in $STAGED_FILES; do
  case "$file" in
    .env | .env.* | secrets/* | *.pem | *.key | *.p12)
      echo "✗ BLOCKED: Refusing to commit sensitive file: $file"
      echo "  If this is intentional, use: git commit --no-verify"
      exit 1
      ;;
  esac
done

# ─────────────────────────────────────────────
# 2. Detect accidental debug artifacts
# ─────────────────────────────────────────────
if git diff --cached | grep -qE '^\+.*(console\.log|debugger;|pdb\.set_trace|breakpoint\(\))'; then
  echo "⚠ WARNING: Staged code contains debug statements (console.log / debugger / pdb)."
  echo "  Continuing — remove these before shipping to production."
fi

# ─────────────────────────────────────────────
# 3. Run linter if available (non-blocking on error)
# ─────────────────────────────────────────────
if [ -f "package.json" ] && grep -q '"lint"' package.json; then
  echo "→ Running lint..."
  if ! npm run lint --silent 2>&1; then
    echo "⚠ Lint issues found. Resolve before merging to main."
    # Non-blocking — allows commit, but warns
  fi
fi

# ─────────────────────────────────────────────
# 4. Verify no merge conflict markers remain
# ─────────────────────────────────────────────
if git diff --cached | grep -qE '^[+](<<<<<<|>>>>>>|=======$)'; then
  echo "✗ BLOCKED: Merge conflict markers found in staged files."
  exit 1
fi

echo "✓ Pre-commit checks passed."
exit 0

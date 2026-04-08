#!/usr/bin/env bash
# .agents/hooks/lint-on-save.sh
# Lightweight lint helper — run from editor on-save hooks or manually.
# Detects project type and runs the appropriate linter.
# Usage: bash .agents/hooks/lint-on-save.sh [optional: filepath]

set -uo pipefail

TARGET="${1:-}"

echo "→ lint-on-save"

# ─────────────────────────────────────────────
# Node.js / TypeScript / JavaScript projects
# ─────────────────────────────────────────────
if [ -f "package.json" ]; then
  if [ -n "$TARGET" ]; then
    # Lint only the changed file if a target is given
    if command -v npx &>/dev/null; then
      if grep -q '"eslint"' package.json 2>/dev/null || [ -f ".eslintrc*" ] || [ -f "eslint.config*" ]; then
        echo "→ ESLint: $TARGET"
        npx eslint "$TARGET" --max-warnings=0 2>&1 || true
      fi
      if [ -f "prettier.config*" ] || [ -f ".prettierrc*" ]; then
        echo "→ Prettier check: $TARGET"
        npx prettier --check "$TARGET" 2>&1 || true
      fi
    fi
  else
    # Full project lint
    if grep -q '"lint"' package.json; then
      echo "→ npm run lint"
      npm run lint 2>&1 || true
    fi
  fi
fi

# ─────────────────────────────────────────────
# Python projects
# ─────────────────────────────────────────────
if [ -f "pyproject.toml" ] || [ -f "setup.py" ] || [ -f "requirements.txt" ]; then
  if command -v ruff &>/dev/null; then
    echo "→ ruff check"
    ruff check "${TARGET:-.}" 2>&1 || true
  elif command -v flake8 &>/dev/null; then
    echo "→ flake8"
    flake8 "${TARGET:-.}" 2>&1 || true
  fi
fi

# ─────────────────────────────────────────────
# Go projects
# ─────────────────────────────────────────────
if [ -f "go.mod" ] && command -v go &>/dev/null; then
  echo "→ go vet"
  go vet ./... 2>&1 || true
fi

echo "✓ lint-on-save complete."
exit 0

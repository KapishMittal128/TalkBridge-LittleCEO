#!/usr/bin/env bash
# ENFORCE STATE SYNC - Antigravity OS Git Hook
# Prevents checking in code if the task.md tracker hasn't been updated.

# Check if src/ or app/ files were modified
if git diff --cached --name-only | grep -E "^(src/|app/|lib/|components/)"; then
  # If code changed, check if task.md or STATE.md changed
  if ! git diff --cached --name-only | grep -E "(task\.md|STATE\.md)"; then
    echo "🚨 [ANTIGRAVITY OS HALT] State Out of Sync!"
    echo "You are committing code without synchronizing task.md or STATE.md."
    echo "Run the agent to dump memory or update task.md manually before committing."
    echo "Bypass with --no-verify only in absolute emergencies."
    exit 1
  fi
fi

# Detect Mega Task (prevent single commits over 20 files without verification)
changed_files=$(git diff --cached --name-only | wc -l)
if [ "$changed_files" -gt 20 ]; then
    echo "⚠️ [ANTIGRAVITY OS WARNING] Mega Task Detected! ($changed_files files changed)"
    echo "Executing overly large execution cycles degrades intelligence and context."
    echo "Consider breaking tasks into smaller atomic commits."
fi

exit 0

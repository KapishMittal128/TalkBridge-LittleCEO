---
name: debugging-workflow
description: Strict bug isolation, logging, and fixing workflow.
---

# 1. Purpose
Resolve run-time errors and bugs systematically without randomly changing code. Also strictly absorbs technical debt cleanup, dead-code elimination, and structural refactoring.

# 2. When to Trigger
Errors, crashes, unexpected behavior, failing tests.

# 3. When NOT to Trigger
Designing new features, aesthetic UI tweaks.

# 4. Scope Boundaries
Log analysis, stack trace reading, variable isolation, precise patching, technical debt cleanup, and localized refactoring.

# 5. Operational Phase
OPERATIONAL_PHASE: BUILD

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: run_command, view_file, multi_replace_file_content
**FORBIDDEN_TOOLS**: Rewrite entire files to fix one bug.
**REASONING_ONLY_OK**: Must execute test commands incrementally to verify.

# 7. Required Output Format
Diff patches focused strictly on the isolated root cause.

# 8. Failure Mode / Risk Awareness
Guessing solutions without reading logs, mutating unrelated code.

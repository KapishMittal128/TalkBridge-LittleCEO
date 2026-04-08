---
name: repo-analysis
description: Context induction and codebase surveying.
---

# 1. Purpose
Understand where everything lives before making changes.

# 2. When to Trigger
Entering a new repo, finding logic, scoping out how a codebase acts.

# 3. When NOT to Trigger
When already deep into module building.

# 4. Scope Boundaries
Filesystem walking, dependency mapping, finding module export chains.

# 5. Operational Phase
OPERATIONAL_PHASE: PLANNING

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: list_dir, grep_search
**FORBIDDEN_TOOLS**: edit_file
**REASONING_ONLY_OK**: Used to generate project mental maps.

# 7. Required Output Format
Accurate structural overview and reference links.

# 8. Failure Mode / Risk Awareness
Assuming file structures blindly.

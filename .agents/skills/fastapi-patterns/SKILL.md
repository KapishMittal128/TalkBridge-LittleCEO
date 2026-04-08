---
name: fastapi-patterns
description: FastAPI framework-specific paradigms and execution.
---

# 1. Purpose
Implement robust Python services using idiomatic FastAPI paradigms.

# 2. When to Trigger
Working on FastAPI backend endpoints, Pydantic modeling, dependency injection.

# 3. When NOT to Trigger
NodeJS tasks, frontend, or general python utility scripts.

# 4. Scope Boundaries
FastAPI router, depends(), Pydantic V2 schemas, async endpoints, middleware.

# 5. Operational Phase
OPERATIONAL_PHASE: BUILD

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: view_file, edit_file, run_command
**FORBIDDEN_TOOLS**: UI generation, Playwright
**REASONING_ONLY_OK**: Execution mode primary.

# 7. Required Output Format
FastAPI code implementing strict Dependency Injection and isolated route files.

# 8. Failure Mode / Risk Awareness
Writing synchronous blocking code in an async endpoint, bypassing Pydantic.

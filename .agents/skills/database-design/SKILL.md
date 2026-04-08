---
name: database-design
description: Database schema modeling and SQL performance optimization.
---

# 1. Purpose
Design Normalized/Denormalized DB schemas, indexes, and optimized queries.

# 2. When to Trigger
Setting up new tables, fixing slow queries, designing relationships.

# 3. When NOT to Trigger
Writing UI code or external API wrappers.

# 4. Scope Boundaries
Tables, relational definitions, foreign keys, constraints, indexing, ORM schema.

# 5. Operational Phase
OPERATIONAL_PHASE: PLANNING

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: read_file
**FORBIDDEN_TOOLS**: run_command (with destructive SQL)
**REASONING_ONLY_OK**: Should output structure before execution.

# 7. Required Output Format
Schema definition mapping or indexing strategy.

# 8. Failure Mode / Risk Awareness
Designing models without foreign keys, ignoring N+1 query risks.

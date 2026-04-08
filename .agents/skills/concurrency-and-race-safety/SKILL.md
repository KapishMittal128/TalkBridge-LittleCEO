---
name: concurrency-and-race-safety
description: Hostile audit for data integrity, state mutation, and race conditions.
---

# 1. Purpose
Audit code for idempotency, atomic state mutations, and parallel execution flaws.

# 2. When to Trigger
Payment flows, inventory decrementing, wallet logic, webhooks, generic parallel updates.

# 3. When NOT to Trigger
Styling, frontend, pure read-only endpoints.

# 4. Scope Boundaries
Idempotency keys, atomic DB operations, locking (optimistic/pessimistic), retries.

# 5. Operational Phase
OPERATIONAL_PHASE: AUDIT

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: read_multiple_files, grep_search
**FORBIDDEN_TOOLS**: write_to_file (do not mutate unless approved)
**REASONING_ONLY_OK**: Reason-only execution required to produce Audit Report.

# 7. Required Output Format
Risk Map outlining Race Conditions and explicit patch solutions.

# 8. Failure Mode / Risk Awareness
Dismissing real flaws as safe. Recommending application level code over DB locks.

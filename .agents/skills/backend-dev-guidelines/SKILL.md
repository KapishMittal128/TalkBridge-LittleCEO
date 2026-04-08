---
name: backend-dev-guidelines
description: General node/python execution logic and patterns.
---

# 1. Purpose
Write and structure robust, stateless, general backend service code.

# 2. When to Trigger
Writing general backend services, workers, business logic, or utility functions.

# 3. When NOT to Trigger
MUST NOT absorb other backend specialties. DO NOT use for: FastAPI routing (use fastapi-patterns), Webhook processing (use webhook-patterns), DB design (use database-design), API design (use api-design-principles), or security/concurrency reviews.

# 4. Scope Boundaries
General node/python service layer code, async execution, error handling. MUST NOT silently absorb framework specialization, webhooks, schema design, or architectural reviews.

# 5. Operational Phase
OPERATIONAL_PHASE: BUILD

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: view_file, edit_file, run_command
**FORBIDDEN_TOOLS**: browser tools, UI tools
**REASONING_ONLY_OK**: Only for planning non-mutating flow. Requires action.

# 7. Required Output Format
Unified backend code patches maintaining single responsibility.

# 8. Failure Mode / Risk Awareness
Mixing controllers, services, and queries in one massive file.

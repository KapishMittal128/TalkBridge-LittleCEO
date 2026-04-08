---
name: decision-redteam
description: Pre-build architectural invalidation and risk discovery.
---

# 1. Purpose
Destroy bad architectural ideas before they are coded.

# 2. When to Trigger
User proposes a massive stack change, complex design, or risky implementation.

# 3. When NOT to Trigger
Standard CRUD build tasks, minor logic fixes.

# 4. Scope Boundaries
Identifying hidden complexity, vendor lock-in, scaling chokepoints.

# 5. Operational Phase
OPERATIONAL_PHASE: PLANNING

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: None.
**FORBIDDEN_TOOLS**: All mutating tools.
**REASONING_ONLY_OK**: Strictly reasoning and logical stress-testing.

# 7. Required Output Format
Adversarial Report prioritizing the highest impact points of failure.

# 8. Failure Mode / Risk Awareness
Agreeing with the user too quickly without pointing out obvious architectural flaws.

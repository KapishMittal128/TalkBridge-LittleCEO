---
name: production-security-and-scale-review
description: Hostile audit weapon against BOLA, auth bypass, and scaling failure.
---

# 1. Purpose
Prevent shipment of severe security vulnerabilities and architectural chokepoints.

# 2. When to Trigger
Before shipping to prod, touching auth code, handling PII, or reviewing overall APIs.

# 3. When NOT to Trigger
Internal non-sensitive tools, styling.

# 4. Scope Boundaries
IDOR/BOLA detection, authentication bypass, rate-limiting, injection flaws.

# 5. Operational Phase
OPERATIONAL_PHASE: AUDIT

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: grep_search, read_file
**FORBIDDEN_TOOLS**: write_to_file (do not mutate unless approved)
**REASONING_ONLY_OK**: Mandatory prior to any sensitive commit.

# 7. Required Output Format
Vulnerability Threat Report exposing actual exploit vectors.

# 8. Failure Mode / Risk Awareness
Approving endpoints that accept user IDs in the request body without checking session context.

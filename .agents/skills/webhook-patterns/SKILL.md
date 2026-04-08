---
name: webhook-patterns
description: Idempotent external event handling and queuing.
---

# 1. Purpose
Safely process uncontrolled external requests (Stripe, GitHub, Twilio).

# 2. When to Trigger
Implementing webhook receivers, event buses, external callback APIs.

# 3. When NOT to Trigger
Standard internal REST GET endpoints.

# 4. Scope Boundaries
Signature verification, idempotency logic, async background job handoffs.

# 5. Operational Phase
OPERATIONAL_PHASE: BUILD

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: edit_file
**FORBIDDEN_TOOLS**: None
**REASONING_ONLY_OK**: Requires synchronous verification and async processing.

# 7. Required Output Format
Secure webhook handler offloading heavy processing to generic service queues.

# 8. Failure Mode / Risk Awareness
Processing heavy jobs inline, resulting in webhook gateway timeouts and uncontrolled retries.

---
name: api-design-principles
description: REST/GraphQL API design and routing structure.
---

# 1. Purpose
Design clear, secure, and scalable API endpoints and data payloads.

# 2. When to Trigger
User asks to design an API, set up routes, define payloads, or outline HTTP methods.

# 3. When NOT to Trigger
Implementing the backend logic or writing queries.

# 4. Scope Boundaries
HTTP methods, URL structure, payload validation schemas, status codes.

# 5. Operational Phase
OPERATIONAL_PHASE: PLANNING

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: read_file, search_web
**FORBIDDEN_TOOLS**: write_to_file, run_command
**REASONING_ONLY_OK**: Must default to reading context and returning mapping.

# 7. Required Output Format
API Blueprint: Endpoint URL, Method, Request Body, Response payload.

# 8. Failure Mode / Risk Awareness
Creating bloated RPC-style endpoints instead of clean REST, or writing implementation code.

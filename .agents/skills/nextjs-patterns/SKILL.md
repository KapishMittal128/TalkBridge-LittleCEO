---
name: nextjs-patterns
description: Next.js App Router and server/client boundary logic.
---

# 1. Purpose
Execute complex Next.js specific framework capabilities correctly.

# 2. When to Trigger
Working with Server Actions, layout.tsx, page.tsx, route handlers, RSC rendering.

# 3. When NOT to Trigger
Standard React logic, generic component design, styling, or usability strategy.

# 4. Scope Boundaries
App Router structure, server/client boundaries, rendering strategy, metadata/route handlers, server actions. MUST NOT own generic component design, aesthetic upgrades, screenshot reconstruction, or UX strategy.

# 5. Operational Phase
OPERATIONAL_PHASE: BUILD

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: view_file, edit_file
**FORBIDDEN_TOOLS**: None
**REASONING_ONLY_OK**: Must isolate network/server logic from client interactivity.

# 7. Required Output Format
Next.js specific file structures preventing hydration or boundary errors.

# 8. Failure Mode / Risk Awareness
Putting 'use client' on everything, ruining SSR performance.

---
name: modern-ui-aesthetics
description: Premium visual design tokens, styling, and UI taste.
---

# 1. Purpose
Apply top-tier design trends (glassmorphism, clean typography, vibrant gradients).

# 2. When to Trigger
Requests to make the app 'look better', styling tweaks, CSS token generation.

# 3. When NOT to Trigger
Modifying state management, React logic, layout implementation, or routing.

# 4. Scope Boundaries
Styling, spacing, visual hierarchy, typography polish, design tokens, aesthetic upgrades. MUST NOT own component logic, React state, routing logic, or framework behavior.

# 5. Operational Phase
OPERATIONAL_PHASE: BUILD

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: read_file, write_to_file
**FORBIDDEN_TOOLS**: Business logic tools.
**REASONING_ONLY_OK**: Design system declaration.

# 7. Required Output Format
A cohesive list of CSS variables or Tailwind utility mappings.

# 8. Failure Mode / Risk Awareness
Using ugly default browser colors and making 'simple' designs when premium is requested.

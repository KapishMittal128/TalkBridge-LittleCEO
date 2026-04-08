---
name: framer-motion-choreo
description: UI Animation and Interaction execution.
---

# 1. Purpose
Add premium, performant motion and scroll behaviors to UI.

# 2. When to Trigger
Requests for smooth transitions, parallax, scroll-animations, stagger effects.

# 3. When NOT to Trigger
Basic layout grid adjustments, CSS color changes, static layout design.

# 4. Scope Boundaries
Motion-specific implementation, React Framer Motion variants, layout animations, GPU-accelerated CSS. MUST NOT own generic frontend styling, component wiring, or CSS layout grids.

# 5. Operational Phase
OPERATIONAL_PHASE: BUILD

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: edit_file
**FORBIDDEN_TOOLS**: backend tools
**REASONING_ONLY_OK**: Should prototype animation variables.

# 7. Required Output Format
Component patches specifically injecting motion wrappers and variants.

# 8. Failure Mode / Risk Awareness
Causing re-render loops or janky CPU-bound animations.

---
name: frontend-design
description: General React/Component implementation logic.
---

# 1. Purpose
Translate layout designs and components into working React/DOM logic.

# 2. When to Trigger
Building dashboards, landing pages, mobile-responsive views, generic React functionality.

# 3. When NOT to Trigger
Visual styling (use modern-ui-aesthetics for taste), visual blueprinting (use visual-reference-cloning), framework rendering strategy/routing (use nextjs-patterns), backend services.

# 4. Scope Boundaries
Component implementation, UI structure, DOM hierarchy, prop/state wiring, interaction logic. MUST NOT own style tokens, visual polish, screenshot decomposition, or framework-specific rendering strategy.

# 5. Operational Phase
OPERATIONAL_PHASE: BUILD

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: edit_file, view_file, 21st-dev-magic, playwright (browser)
**FORBIDDEN_TOOLS**: backend configuration, database alterations, generic run_command mutations
**REASONING_ONLY_OK**: Task breakdown into smaller components.

# 7. Required Output Format
Working cleanly scoped frontend framework implementation.

# 8. Failure Mode / Risk Awareness
Creating 1000-line monolithic components.

---
name: system-architecture
description: High-level module diagramming and component structure mapping.
---

# 1. Purpose
Define the boundaries, dependencies, and communication channels of the software.

# 2. When to Trigger
Creating a new app from scratch, restructuring a monolithic codebase.

# 3. When NOT to Trigger
Writing an individual button component.

# 4. Scope Boundaries
System diagrams, tech stack definition, module boundaries.

# 5. Operational Phase
OPERATIONAL_PHASE: PLANNING

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: None
**FORBIDDEN_TOOLS**: Mutating tools.
**REASONING_ONLY_OK**: Architecture documentation.

# 7. Required Output Format
System Design Document specifying the layer separation.

# 8. Failure Mode / Risk Awareness
Creating cyclic dependencies or highly coupled monoliths.

---
name: visual-reference-cloning
description: Reference-to-code reconstruction of websites/UI from visual clues.
---

# 1. Purpose
Deconstruct visual screenshots/references into editable accurate DOM hierarchies and layouts.

# 2. When to Trigger
Requests to clone a website, match a reference design, or translate an image into layout boundaries.

# 3. When NOT to Trigger
Generic frontend implementation, framework routing, styling taste, or UI logic wiring.

# 4. Scope Boundaries
Screenshot/reference analysis, layout decomposition, section extraction, fidelity-aware reconstruction planning. MUST NOT own generic frontend implementation, framework routing, aesthetic taste, or UI logic wiring.

# 5. Operational Phase
OPERATIONAL_PHASE: BUILD

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: browser tools, read_media_file
**FORBIDDEN_TOOLS**: backend configuration, database alterations
**REASONING_ONLY_OK**: Analyze visual fidelity to extract design tokens and structure.

# 7. Required Output Format
Reconstruction Blueprint: Section Map, Component Inventory, Spacing/Typography Specs, Reassembly sequence.

# 8. Failure Mode / Risk Awareness
Outputting generic frontend code without analyzing the specific visual dimensions, structural grid, and exact spacing of the reference target.

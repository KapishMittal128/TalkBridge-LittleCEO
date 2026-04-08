---
name: seo-audit-workflow
description: Technical SEO, metadata, and accessibility checks.
---

# 1. Purpose
Execute pure, technical SEO audits focusing on crawlability and SSR/static site visibility. Not a generic growth or marketing tool.

# 2. When to Trigger
Finalizing a public-facing website or content platform.

# 3. When NOT to Trigger
Internal SaaS dashboards, marketing strategy, generic copywriting, or product growth ideation.

# 4. Scope Boundaries
Metadata tags, semantic HTML (H1/H2), alt attributes, OpenGraph data, sitemaps. MUST NOT drift into generic marketing tasks or broad growth strategy.

# 5. Operational Phase
OPERATIONAL_PHASE: AUDIT

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: read_file, browser tools
**FORBIDDEN_TOOLS**: Mutating core React component states.
**REASONING_ONLY_OK**: Perform DOM inspections.

# 7. Required Output Format
Checklist of injected SEO optimisations applied.

# 8. Failure Mode / Risk Awareness
Hiding important text in non-crawleable elements.

---
name: deployment-workflow
description: CI/CD, serverless configuration, and deployment.
---

# 1. Purpose
Configure Docker, Github Actions, Vercel, serverless, and pipelines safely.

# 2. When to Trigger
Shipping to production, setting up workflows, configuring env vars in PAAS.

# 3. When NOT to Trigger
Local application logic or frontend styling.

# 4. Scope Boundaries
YAML pipelines, build scripts, dockerfiles, deployment edge configs.

# 5. Operational Phase
OPERATIONAL_PHASE: SHIP

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: run_command, edit_file
**FORBIDDEN_TOOLS**: Changing business logic outside of infra code.
**REASONING_ONLY_OK**: Must produce valid YAML/config before execution.

# 7. Required Output Format
Complete infra files or deployment checklist.

# 8. Failure Mode / Risk Awareness
Shipping broken YAML pipelines containing syntax errors.

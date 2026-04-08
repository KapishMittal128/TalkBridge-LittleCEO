---
name: ml-evaluation-checklist
description: ML model integration testing and pipeline quality gate.
---

# 1. Purpose
Ensure ML predictions are monitored, robust, and handle outliers gracefully.

# 2. When to Trigger
Finalizing an ML pipeline, testing classifier accuracy, mapping failure cases.

# 3. When NOT to Trigger
Setting up standard web servers.

# 4. Scope Boundaries
Confusion matrices, thresholding logic, error handling for edge ML responses, latency.

# 5. Operational Phase
OPERATIONAL_PHASE: AUDIT

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: run_command, read_file
**FORBIDDEN_TOOLS**: UI tools
**REASONING_ONLY_OK**: Auditing outputs against known test sets.

# 7. Required Output Format
QA report with False Positive / False Negative mitigation steps.

# 8. Failure Mode / Risk Awareness
Deploying without a fallback state when the ML model returns nil/hallucinations.

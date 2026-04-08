---
name: ml-system-builder
description: ML pipeline, inference, and classification workflow execution.
---

# 1. Purpose
Build scalable and performant ML wrappers, inference endpoints, and data loaders.

# 2. When to Trigger
Running classifiers, LLM pipelines, RAG, tensor operations, embeddings.

# 3. When NOT to Trigger
CRUD APIs without machine learning.

# 4. Scope Boundaries
Batch processing, GPU context handling, prompt chaining, embeddings DB inserts.

# 5. Operational Phase
OPERATIONAL_PHASE: BUILD

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: run_command, edit_file
**FORBIDDEN_TOOLS**: frontend tooling
**REASONING_ONLY_OK**: Architecting flow before writing batch logic.

# 7. Required Output Format
Code encapsulating models away from core application code.

# 8. Failure Mode / Risk Awareness
Mixing raw inference library calls directly inside API HTTP route handlers.

# ANTIGRAVITY CAPABILITY ROUTING INDEX

> **CRITICAL OS DIRECTIVE:** All skill execution, routing, and task decomposition MUST be governed by the rules in `SYSTEM_ORCHESTRATION.md`. Session continuity and phase locking MUST be governed by `EXECUTION_RUNNER.md`. You must read and follow these files before initiating workflows.

# SYSTEM ROUTING PRIORITY (FUNCTIONAL RISK > TECH STACK)
*   **RULE 1:** If the task involves modifying high-stakes backend state (Payments, Users, Infrastructure Boundaries), you MUST invoke Security or Concurrency audit skills FIRST, ignoring frontend/stack aliases until verified.
*   **RULE 2:** Decompose tasks. Never assume a generic frontend request handles auth/database mutation safely without routing those subsets to the appropriate backend skills.
*   **RULE 3:** Never use fallback generic skills if a specific high-priority skill applies.

---
## CATEGORY 1: ARCHITECTURE, DISCOVERY & PLANNING
| Specific Action | Primary Skill Target | Fallback Logic |
| :--- | :--- | :--- |
| Deconstruct an image/reference into a cloneable DOM layout | `visual-reference-cloning` | Use for layout reconstruction maps. |
| Break epic into implementation tasks | `spec-driven-build` | Define build milestones. |
| Define system-wide components & modules | `system-architecture` | Block cyclic monoliths. |
| Challenge risk vectors before building | `decision-redteam` | Adversarial architecture check. |
| Explore current repo structure/vars | `repo-analysis` | Context loading only. |

---
## CATEGORY 2: FRONTEND & UI (Pixel/Interaction Execution)
| Specific Action | Primary Skill Target | Fallback Logic |
| :--- | :--- | :--- |
| Apply premium visual styling & css tokens | `modern-ui-aesthetics` | Elevate design constraints. |
| Define usability flows & user logic | `uxui-principles` | Ensure interaction clarity. |
| Recreate/construct component state logic | `frontend-design` | The main React execution line. |
| Next.js App Router (RSC, Server Actions)| `nextjs-patterns` | Framework boundary enforcement. |
| Animate components / configure layout transitions | `framer-motion-choreo` | GPU accelerated UI interaction. |

---
## CATEGORY 3: BACKEND, DATA & PIPELINES (Logic Execution)
| Specific Action | Primary Skill Target | Fallback Logic |
| :--- | :--- | :--- |
| Set REST/Webhook schemas and payloads | `api-design-principles` | Define endpoint boundaries. |
| Write general backend/service business logic | `backend-dev-guidelines` | Core Node/Python function execution. |
| Write FastAPI endpoints and async loops | `fastapi-patterns` | Python framework implementation. |
| Design databases & optimize SQL | `database-design` | Normalized schema definition. |
| Handle external events/queues | `webhook-patterns` | External idempotency. |

---
## CATEGORY 4: SECURITY & CONCURRENCY (Audit / Ship Blocking)
| Specific Action | Primary Skill Target | Fallback Logic |
| :--- | :--- | :--- |
| Protect critical transactions/stock | `concurrency-and-race-safety` | Stop state bleed. |
| BOLA / Abuse mitigation | `production-security-and-scale-review` | Block credential attacks. |

---
## CATEGORY 5: DEBUGGING, QA & SHIP (Stabilization)
| Specific Action | Primary Skill Target | Fallback Logic |
| :--- | :--- | :--- |
| Isolate bug roots & test iteratively | `debugging-workflow` | Fix logical/runtime crashes. |
| Run E2E logic loops in browser | `playwright-e2e-testing` | Assertion creation. |
| Deploy infra & build configurations | `deployment-workflow` | Serverless / CLI CI/CD workflows. |
| Ensure metadata & semantic visibility | `seo-audit-workflow` | Web markup auditing. |

---
## CATEGORY 6: SPECIALIST (ML & Conversion)
| Specific Action | Primary Skill Target | Fallback Logic |
| :--- | :--- | :--- |
| Architect RAG / LLM systems | `ml-system-builder` | Data prep & invocation wrappers. |
| Mitigate model hallucination / metrics | `ml-evaluation-checklist` | Stop unreliable ML output. |
| Create engagement / sales copy | `conversion-copywriting` | Tone and layout copy injection. |

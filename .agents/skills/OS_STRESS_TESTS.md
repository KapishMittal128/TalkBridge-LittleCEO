# ANTIGRAVITY OS: STRESS TEST SUITE

Purpose: 30 structured, real-world routing and orchestration test cases designed to prove whether the Antigravity OS routes, decomposes, and sequences correctly under messy or ambiguous user prompt conditions.

## CATEGORY A — Clean Single-Skill Tasks

### Test ID: A-01
**User Prompt:** "Fix this React state bug in the sidebar toggle."
**Expected Primary Skill:** `frontend-design`
**Expected Phase Order:** BUILD
**Common Wrong Routing Failure:** Choosing `debugging-workflow` which assumes deeper systemic analysis.
**Pass/Fail Criteria:** Directly mutates the React component focusing purely on UI state wire-up.

### Test ID: A-02
**User Prompt:** "Design a REST API endpoint spec for the new invoice generation feature."
**Expected Primary Skill:** `api-design-principles`
**Expected Phase Order:** PLANNING
**Common Wrong Routing Failure:** Triggering `backend-dev-guidelines` and mutating code before spec.
**Pass/Fail Criteria:** Delivers a strict spec/contract document in markdown without modifying implementation.

### Test ID: A-03
**User Prompt:** "Review this login auth flow. Could a user escalate privilege by modifying the JWT?"
**Expected Primary Skill:** `production-security-and-scale-review`
**Expected Phase Order:** AUDIT
**Common Wrong Routing Failure:** Generating code/fixes instantly via `backend-dev-guidelines` instead of reason-first audit.
**Pass/Fail Criteria:** Produces a markdown vulnerability report with REASONING ONLY, no code mutation.

### Test ID: A-04
**User Prompt:** "Refactor this database schema to use proper foreign keys for the Order table."
**Expected Primary Skill:** `database-design`
**Expected Phase Order:** PLANNING/BUILD
**Common Wrong Routing Failure:** Using `fastapi-patterns` just because the models loosely map to SQLAlchemy.
**Pass/Fail Criteria:** Applies precise DB modeling principles irrespective of the underlying framework wrapper.

### Test ID: A-05
**User Prompt:** "Animate this modal so it slides in from the bottom with a spring effect."
**Expected Primary Skill:** `framer-motion-choreo`
**Expected Phase Order:** BUILD
**Common Wrong Routing Failure:** `modern-ui-aesthetics` attempting layout hacks to mimic motion.
**Pass/Fail Criteria:** Utilizes Framer Motion attributes (`AnimatePresence`, variants) strictly decoupled from CSS grid manipulation.

---

## CATEGORY B — Framework-Confusing Tasks

### Test ID: B-01
**User Prompt:** "Build a FastAPI webhook handler for Stripe."
**Expected Decomposition:** `webhook-patterns` -> `fastapi-patterns` -> `production-security-and-scale-review`
**Expected Phase Order:** PLANNING -> BUILD -> AUDIT
**Common Wrong Routing Failure:** Routing purely to `fastapi-patterns` without honoring webhook retry logic, idempotency, or signature validation.
**Pass/Fail Criteria:** Splits the task: first establish webhook resilience bounds, then implement inside FastAPI, then audit for replay attacks.

### Test ID: B-02
**User Prompt:** "Create a Next.js landing page with SSR and dynamic metadata for SEO."
**Expected Decomposition:** `seo-audit-workflow` (Planning) -> `nextjs-patterns` (Execution)
**Expected Phase Order:** PLANNING -> BUILD
**Common Wrong Routing Failure:** Overloading `frontend-design` to handle SSR fetching and SEO meta-tags simultaneously.
**Pass/Fail Criteria:** Distinct separation between defining the dynamic SEO constraints and wiring the Next.js App router logic.

### Test ID: B-03
**User Prompt:** "Refactor this FastAPI auth endpoint so it can handle 10k requests per second safely."
**Expected Decomposition:** `production-security-and-scale-review` / `concurrency-and-race-safety` -> `fastapi-patterns`
**Expected Phase Order:** AUDIT -> BUILD
**Common Wrong Routing Failure:** Skipping right to `fastapi-patterns` to change `async def` wrappers without checking for connection pooling or race states.
**Pass/Fail Criteria:** An explicit AUDIT phase must halt execution until rate-limiting and pooling constraints are output/approved.

### Test ID: B-04
**User Prompt:** "Make my Django background workers run on Redis using Celery for queue processing."
**Expected Primary Skill:** `concurrency-and-race-safety`
**Expected Phase Order:** PLANNING
**Common Wrong Routing Failure:** Mistyping standard `backend-dev-guidelines` without handling queue deduplication and race locking.
**Pass/Fail Criteria:** Routes to concurrency principles outlining worker idempotency FIRST before writing task decorators.

### Test ID: B-05
**User Prompt:** "Wire this Framer Motion slider into our Next.js App Router layout."
**Expected Decomposition:** `nextjs-patterns` -> `framer-motion-choreo`
**Expected Phase Order:** BUILD -> BUILD
**Common Wrong Routing Failure:** `frontend-design` trying to forcefully jam 'use client' and motion variants into the same monolithic page update.
**Pass/Fail Criteria:** Properly hands off: Next.js module handles the Client/Server boundary, then Motion module handles the visual injection.

---

## CATEGORY C — Multi-Domain Product Tasks

### Test ID: C-01
**User Prompt:** "Build a SaaS dashboard with subtle glassmorphism animations and role-based auth."
**Expected Decomposition:** `system-architecture` -> `frontend-design` -> `modern-ui-aesthetics` -> `production-security-and-scale-review`
**Expected Primary Skill:** Sequenced decomposition.
**Common Wrong Routing Failure:** Assuming `frontend-design` can single-handedly write the layout, paint the glassmorphism, and enforce RBAC logic simultaneously.
**Pass/Fail Criteria:** Distinct sequence triggering architecture, then building UI logic, applying styling tokens, and finally auditing RBAC.

### Test ID: C-02
**User Prompt:** "Clone this homepage exactly and make the layout responsive across mobile/desktop."
**Expected Decomposition:** `visual-reference-cloning` -> `modern-ui-aesthetics`
**Expected Phase Order:** BUILD
**Common Wrong Routing Failure:** Running `visual-reference-cloning` infinitely without stopping and handing off styling tweaks.
**Pass/Fail Criteria:** `visual-reference-cloning` emits the structural blueprint and halts; handoff completes responsiveness.

### Test ID: C-03
**User Prompt:** "Ship a booking system API with stock locking and a React admin UI."
**Expected Decomposition:** `database-design` -> `concurrency-and-race-safety` -> `backend-dev-guidelines` -> `frontend-design`
**Expected Phase Order:** PLANNING -> AUDIT -> BUILD -> BUILD
**Common Wrong Routing Failure:** Letting generic `backend-dev-guidelines` write stock decrement logic without lock guards.
**Pass/Fail Criteria:** Enforces concurrency locks on the DB/Backend *before* generating Admin UI code.

### Test ID: C-04
**User Prompt:** "Create an ML-powered video summarization feature with a React upload portal."
**Expected Decomposition:** `ml-system-builder` -> `backend-dev-guidelines` -> `frontend-design`
**Expected Phase Order:** PLANNING/BUILD -> BUILD -> BUILD
**Common Wrong Routing Failure:** Building the UI first while abandoning the pipeline latency bounds.
**Pass/Fail Criteria:** Correct sequential triggering of ML orchestration mapped back to frontend chunking uploaders.

### Test ID: C-05
**User Prompt:** "We need a new landing page with high-converting copy and dynamic pricing tiers."
**Expected Decomposition:** `conversion-copywriting` -> `frontend-design` -> `api-design-principles`
**Expected Phase Order:** PLANNING -> BUILD -> BUILD
**Common Wrong Routing Failure:** Handing landing page text generation off to `frontend-design` or `modern-ui-aesthetics`.
**Pass/Fail Criteria:** Copy is generated structurally via `conversion-copywriting` prior to DOM construction.

---

## CATEGORY D — Ambiguous / Messy User Prompts

### Test ID: D-01
**User Prompt:** "Make this app better."
**Expected Primary Skill:** Fallback -> `debugging-workflow` / `UXUI-principles` (Based on context)
**Expected Phase Order:** PLANNING
**Common Wrong Routing Failure:** Making random arbitrary CSS changes or blindly refactoring components.
**Pass/Fail Criteria:** OS safely escalates to analyze application structure rather than mutating.

### Test ID: D-02
**User Prompt:** "Fix the backend and make the frontend more premium."
**Expected Decomposition:** `debugging-workflow` (Backend) -> `modern-ui-aesthetics` (Frontend)
**Expected Phase Order:** AUDIT -> BUILD
**Common Wrong Routing Failure:** Executing both simultaneously in one messy monolithic tool call.
**Pass/Fail Criteria:** Prompts task decomposition into two sequentially isolated objectives.

### Test ID: D-03
**User Prompt:** "I want this site to feel like Stripe but faster and more secure."
**Expected Decomposition:** `modern-ui-aesthetics` -> `production-security-and-scale-review`
**Expected Phase Order:** BUILD -> AUDIT
**Common Wrong Routing Failure:** Picking `visual-reference-cloning` for "feel like Stripe" ignoring security.
**Pass/Fail Criteria:** Decouples the aesthetic prompt from the non-functional performance/security directives.

### Test ID: D-04
**User Prompt:** "Can we add AI to this workflow?"
**Expected Primary Skill:** Fallback -> `spec-driven-build` / `system-architecture`
**Expected Phase Order:** PLANNING
**Common Wrong Routing Failure:** Randomly integrating OpenAI endpoints into random UI buttons without a plan.
**Pass/Fail Criteria:** Forces planning phase to map integration bounds.

### Test ID: D-05
**User Prompt:** "It’s broken. Fix it."
**Expected Primary Skill:** `debugging-workflow`
**Expected Phase Order:** AUDIT
**Common Wrong Routing Failure:** Modifying `page.tsx` blindly attempting a fix.
**Pass/Fail Criteria:** Agent requests console logs or initiates deterministic trace logic via debugging rules.

---

## CATEGORY E — Security / Concurrency Trap Tasks

### Test ID: E-01
**User Prompt:** "Implement wallet crediting when an API request arrives."
**Expected Primary Skill:** `concurrency-and-race-safety`
**Expected Phase Order:** AUDIT/PLANNING
**Common Wrong Routing Failure:** `backend-dev-guidelines` building an update query without a transaction/row lock.
**Pass/Fail Criteria:** Forced block enforcing row-level locking or idempotency keys before writing SQL.

### Test ID: E-02
**User Prompt:** "Handle Stripe webhook updates for subscription statuses."
**Expected Primary Skill:** `webhook-patterns` + `concurrency-and-race-safety`
**Expected Phase Order:** PLANNING/BUILD
**Common Wrong Routing Failure:** Missing signature validation or duplicating subscription upgrades on retry.
**Pass/Fail Criteria:** Execution mandates strict idempotency cache bounds.

### Test ID: E-03
**User Prompt:** "Users can book the same slot twice right now — fix the Next.js API."
**Expected Decomposition:** `concurrency-and-race-safety` -> `nextjs-patterns`
**Expected Phase Order:** AUDIT -> BUILD
**Common Wrong Routing Failure:** Falsely assuming Next.js `nextjs-patterns` provides database-level race protection.
**Pass/Fail Criteria:** Security risk overrides framework logic, enforcing DB constraints.

### Test ID: E-04
**User Prompt:** "Build an endpoint to update user passwords securely."
**Expected Decomposition:** `production-security-and-scale-review` -> `backend-dev-guidelines`
**Expected Phase Order:** AUDIT -> BUILD
**Common Wrong Routing Failure:** Writing the endpoint without hashing/salt specs or rate limiting enumeration.
**Pass/Fail Criteria:** Audit node validates crypto standards prior to code commit.

### Test ID: E-05
**User Prompt:** "Create a global cache for active user sessions."
**Expected Primary Skill:** `concurrency-and-race-safety`
**Expected Phase Order:** PLANNING
**Common Wrong Routing Failure:** In-memory global variables instead of distributed locking (Redis).
**Pass/Fail Criteria:** Identifies stale data/race issues across multiple workers conceptually before writing cache setters.

---

## CATEGORY F — Legacy / Audit / Repair Tasks

### Test ID: F-01
**User Prompt:** "Review this old codebase and tell me what’s broken."
**Expected Primary Skill:** `repo-analysis` -> `debugging-workflow`
**Expected Phase Order:** PLANNING -> AUDIT
**Common Wrong Routing Failure:** Mutating "broken" code on the fly during the READ loop.
**Pass/Fail Criteria:** Generates a read-only dependency/map report with no modifications allowed.

### Test ID: F-02
**User Prompt:** "This production API is slow and occasionally throws 500s."
**Expected Primary Skill:** `production-security-and-scale-review`
**Expected Phase Order:** AUDIT
**Common Wrong Routing Failure:** Arbitrarily switching libraries for "performance" rather than diagnosing bottlenecks.
**Pass/Fail Criteria:** Produces scaling analysis report (DB indexing, N+1 queries, memory leaks).

### Test ID: F-03
**User Prompt:** "Why does this React table component break when 5,000 rows load?"
**Expected Primary Skill:** `frontend-design`
**Expected Phase Order:** AUDIT/BUILD
**Common Wrong Routing Failure:** Ignoring virtualization and simply rewriting map filters.
**Pass/Fail Criteria:** Identifies missing virtualization constraints before modifying the DOM.

### Test ID: F-04
**User Prompt:** "Clean out all the unused components and fix the imports."
**Expected Primary Skill:** `debugging-workflow`
**Expected Phase Order:** AUDIT/BUILD
**Common Wrong Routing Failure:** Using `repo-analysis` without taking action, or `frontend-design` trying to style them.
**Pass/Fail Criteria:** Successfully operates as the technical debt garbage collector.

### Test ID: F-05
**User Prompt:** "Our database query is taking 3 seconds. Here is the SQL schema and trace."
**Expected Primary Skill:** `database-design`
**Expected Phase Order:** AUDIT
**Common Wrong Routing Failure:** Switching to ORM execution via `backend-dev-guidelines`.
**Pass/Fail Criteria:** Solves purely with index optimization or execution plan analysis.

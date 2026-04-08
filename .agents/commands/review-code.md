# Command: review-code

## Purpose

A structured workflow for producing honest, actionable code reviews. Identifies correctness issues, security risks, reliability gaps, and maintainability problems — in that priority order.

## When to Use

- Reviewing code before merging to main
- Auditing code quality in a critical path
- Checking code written by a previous agent or session
- Evaluating whether code is production-ready
- Comparing two implementation approaches

---

## Execution Workflow

### Phase 1: Establish Intent

1. Read the feature description or ticket context — understand what this code is supposed to do
2. Identify the scope of the review: which files, which changes
3. Note the production risk level: is this a critical path, a new feature, or a utility?

**Output:** Review scope and intent confirmed

---

### Phase 2: Correctness Check

1. Trace the main execution path — does the code do what it claims?
2. Identify missing edge cases: empty inputs, null values, boundary conditions
3. Check all async operations: are Promises handled? Can any throw uncaught?
4. Verify conditional logic paths — are all branches covered?

**Flag:** [CRITICAL] for any path that produces wrong behavior in normal usage

---

### Phase 3: Security Check

1. Trace all user-controlled inputs: are they validated and sanitized before use?
2. Check for injection risks (SQL, command, template injection)
3. Verify authentication and authorization are enforced on every protected operation
4. Check for sensitive data exposure in logs, responses, or error messages

**Flag:** [CRITICAL] for any direct security risk

---

### Phase 4: Reliability Check

1. What happens when a dependency (DB, API, queue) is unavailable?
2. Are errors logged with enough context to debug in production?
3. Are there race conditions or ordering dependencies that could fail under load?
4. Are timeouts set on any external calls?

**Flag:** [HIGH] for reliability gaps that would cause silent failures in production

---

### Phase 5: Maintainability Check

1. Is the intent of the code clear from reading it?
2. Is logic correctly separated across layers (no fat controllers, no business logic in routes)?
3. Is there meaningful duplication that should be extracted?
4. Are complex decisions commented?

**Flag:** [MEDIUM] or [LOW] for maintainability issues depending on severity

---

### Phase 6: Verdict

Deliver a clear verdict:
- **Ready to ship** — no blocking issues found
- **Needs changes** — specific issues must be resolved before merging
- **Needs redesign** — the approach has fundamental problems that cannot be fixed by patching

**Apply completion gate from `rules/done-criteria.md` (Research Output or relevant product section) to the review process itself.**

---

## Output Expectations

- A findings list sorted by severity: [CRITICAL] → [HIGH] → [MEDIUM] → [LOW]
- For every [CRITICAL] and [HIGH] finding: the specific file/line and a concrete fix
- A clear final verdict

---

## Constraints

- Do not flag style preferences as correctness issues
- Do not give a "Needs redesign" verdict without explaining exactly what is broken about the design
- Do not approve code with unhandled errors on critical-path operations
- Do not review code you haven't actually read

# Command: build-feature

## Purpose

A structured workflow for implementing a new feature cleanly inside an existing codebase. Ensures the implementation fits the current architecture before writing any code.

## When to Use

- Adding a new capability to an existing system
- Implementing a scoped task from a spec or ticket
- Building a new page, API endpoint, or service
- Extending an existing model or workflow

---

## Execution Workflow

### Phase 1: Understand the Feature

1. Read the full feature request — understand the *why*, not just the *what*
2. Define the acceptance criteria: what does "done" look like?
3. Identify the user or system that will use this feature
4. Clarify any ambiguities before touching any code — do not make assumptions about unclear requirements

**Output:** Feature intent confirmed, acceptance criteria defined

---

### Phase 2: Inspect the Architecture

1. Locate the relevant area of the codebase (routes, components, services, DB models)
2. Read the existing patterns used in adjacent features
3. Identify the correct abstraction layer for the new code to live in
4. Check for existing utilities, hooks, or services that the new feature should use (avoid duplication)

**Output:** Integration point identified, existing patterns understood

---

### Phase 3: Define the Integration Path

1. Specify exactly which files will be created and which will be modified
2. Define any new data models or schema changes required
3. Identify any new dependencies needed (and whether they are justified)
4. Note any migration steps required (DB changes, env variables, etc.)

**Output:** Clear implementation blueprint — no surprises during execution

---

### Phase 4: Implement

1. Create new files before modifying existing ones
2. Follow the patterns established in Phase 2 — do not invent new patterns unless justified
3. Write validation, error handling, and edge case logic — not just the happy path
4. Keep implementations focused: one coherent change, not a sprawl

**Output:** Working implementation that passes its acceptance criteria

---

### Phase 5: Verify

1. Test the happy path manually or with automated tests
2. Test the edge cases and error paths
3. Check that existing functionality has not regressed
4. Review the implementation against the acceptance criteria defined in Phase 1
5. **Apply completion gate from `rules/done-criteria.md` (Web App Feature or API Endpoint section).**

**Output:** Feature confirmed as working, no regressions introduced

---

## Output Expectations

- All changed files listed with a brief description of what changed
- Confirmation that the acceptance criteria are met
- Any follow-on work required (e.g., documentation, future cleanup) flagged clearly

---

## Constraints

- Do not begin implementing before the integration path is clear
- Do not add new dependencies without justification
- Do not mix feature implementation with unrelated refactoring
- Do not ship a feature without verifying the error path works

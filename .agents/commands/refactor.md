# Command: refactor

## Purpose

A structured workflow for improving the internal structure of existing code without changing its external behavior. Reduces complexity, eliminates duplication, and improves maintainability.

## When to Use

- Code is working but hard to read, change, or extend
- Duplication exists across multiple locations
- A module has grown beyond a single clear responsibility
- Upcoming feature work requires the existing code to be cleaner first
- Technical debt is slowing down development velocity

---

## Execution Workflow

### Phase 1: Identify the Pain

1. Read the code that is being targeted for refactoring
2. Articulate specifically what is wrong — not just "it's messy"
   - Is it too long? Too many responsibilities?
   - Is there duplication? Where exactly?
   - Is the naming misleading?
   - Is there coupling that makes changes risky?
3. Define what "better" looks like in concrete terms

**Output:** Specific pain points identified, clear improvement target defined

---

### Phase 2: Define the Behavioral Contract

1. Identify what this code currently does — its inputs, outputs, and side effects
2. Identify which tests currently cover this behavior (if any)
3. If tests don't exist for the code being refactored, write minimal tests to lock the behavior first
4. This behavioral contract must remain intact after the refactor

**Output:** Behavioral contract documented, test coverage confirmed

---

### Phase 3: Execute the Refactor

Apply only the transformation(s) needed to address the identified pain. Common moves:

- **Extract function** — pull out a coherent unit of logic into its own named function
- **Extract class/module** — separate concerns into distinct units
- **Replace magic values** — make constants or enums out of inline values
- **Simplify conditionals** — flatten nested logic, guard clauses over deep nesting
- **Remove duplication** — extract shared logic, not just copy-pasting a fix

Apply one transformation at a time. Do not refactor everything in one large sweep.

**Output:** Cleaner code that does the same thing

---

### Phase 4: Verify Behavior is Preserved

1. Run the full test suite — all existing tests must still pass
2. Manually test any behavior that wasn't covered by tests
3. Check adjacent code that integrates with the refactored module
4. Confirm the behavior under edge cases has not changed
5. **Apply completion gate from `rules/done-criteria.md` (Refactor section).**

**Output:** Passing test suite, no behavioral regressions

---

## Output Expectations

- A concise description of what was changed and why
- Confirmation that behavior is preserved (test results)
- Any remaining technical debt that was intentionally left for a future pass

---

## Constraints

- Stop immediately if behavior changes are introduced — revert and reapproach
- Do not refactor code that does not need to be changed as part of this pass
- Do not mix new feature development with refactoring in the same change
- Do not refactor without first locking the behavioral contract
- If the refactor requires major architectural changes, escalate to the Planner

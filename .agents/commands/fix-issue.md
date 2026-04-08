# Command: fix-issue

## Purpose

A structured workflow for diagnosing and fixing bugs, regressions, broken flows, and unexpected behavior. Ensures the root cause is confirmed before any fix is applied.

## When to Use

- Something is broken and the cause needs to be found
- A test is failing
- A user flow produces an incorrect result
- A previous fix didn't hold
- An error message appeared in logs or the UI

---

## Execution Workflow

### Phase 1: Reproduce

1. Read the full issue description, error message, and any stack traces
2. Identify which environment the failure occurs in (local, staging, prod)
3. Establish the exact steps to reproduce the failure
4. If you cannot reproduce it, do not proceed to fix — investigate why it can't be reproduced first

**Output:** Confirmed reproduction path

---

### Phase 2: Isolate

1. Identify the file and function where the failure originates (not where the error surfaces — where it begins)
2. Read the relevant code fully — do not scan, read
3. Form a hypothesis: what is the specific mechanism causing the failure?
4. Eliminate alternative causes by inspection — not by patching them

**Output:** Confirmed root cause with file + line reference

---

### Phase 3: Fix

1. Write the smallest possible fix that addresses the confirmed root cause
2. Do not fix unrelated issues in the same change
3. Do not add defensive null checks everywhere — fix the actual source of the unexpected state
4. If the fix requires a data migration or schema change, flag it explicitly

**Output:** Minimal, targeted code change

---

### Phase 4: Verify

1. Rerun the failing test or retrace the failing user flow
2. Confirm the error is gone
3. Check that adjacent paths haven't regressed (run relevant test suites)
4. If the fix was non-obvious, add a comment explaining why it was necessary
5. **Apply completion gate from `rules/done-criteria.md` (Bug Fix section).**

**Output:** Confirmed fix with passing verification

---

## Output Expectations

- A brief explanation of the root cause
- The specific file(s) and line(s) changed
- Confirmation that the issue is resolved
- Any follow-up risks or related concerns flagged (but not fixed in this change)

---

## Constraints

- Never apply a fix before confirming the root cause
- Never fix multiple bugs in a single `fix-issue` run unless they share a root cause
- Never suppress errors — replace them with proper handling
- Never ship a fix that you cannot verify is correct

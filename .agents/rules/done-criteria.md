# done-criteria.md — Completion Gates

Apply the matching checklist during the VERIFY phase before declaring any task done.
All checked items must pass. Unchecked items are failures, not deferred work.

---

## Website / Landing Page

- [ ] Renders correctly at mobile (375px), tablet (768px), desktop (1280px)
- [ ] No console errors or warnings in browser
- [ ] All interactive elements have hover and focus states
- [ ] No placeholder copy, lorem ipsum, or TODO text visible
- [ ] Page title and meta description are set
- [ ] Images load and have alt text
- [ ] No obvious blocking render issues (layout shift, invisible content on load)

---

## Web App Feature

- [ ] Happy path works end-to-end
- [ ] At least one error path confirmed (invalid input, network failure, or unauthorized access)
- [ ] TypeScript passes — `tsc --noEmit` returns zero errors
- [ ] Existing tests pass — no regressions introduced
- [ ] No `console.log`, `debugger`, or debug artifacts in committed code
- [ ] Required ENV vars are documented (in `.env.example` or equivalent)

---

## API Endpoint

- [ ] Returns correct HTTP status codes for success and error cases
- [ ] Invalid or malformed input is rejected with a clear error response
- [ ] Auth is enforced if the route requires it — unauthenticated requests return 401/403
- [ ] No raw DB errors, stack traces, or internal paths in response bodies
- [ ] Endpoint is documented if it is part of a public or shared contract

---

## Bug Fix

- [ ] Root cause confirmed — not a symptom suppressed
- [ ] Original failure case no longer reproduces
- [ ] Adjacent paths checked: no regressions introduced
- [ ] Fix comment added if the change is non-obvious

---

## Refactor

- [ ] Behavior is unchanged — all existing tests pass
- [ ] No new external dependencies introduced without justification
- [ ] Public interfaces are unchanged, or the change is intentional and flagged
- [ ] Result is simpler or more readable — not just differently structured

---

## Research Output

- [ ] Conclusion directly answers the question asked — no topic drift
- [ ] Sources are cited or inspectable
- [ ] Tradeoffs stated — not just a single recommendation without context
- [ ] Assumptions are explicit, not buried

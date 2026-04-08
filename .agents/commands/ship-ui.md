# Command: ship-ui

## Purpose

A structured workflow for taking a frontend UI from its current state to production-quality — correct layout, clear hierarchy, real responsiveness, and polished implementation.

## When to Use

- A page or component is functionally working but visually rough
- A landing page needs to be production-ready
- A dashboard or UI feature needs polish before shipping
- Layout, spacing, or hierarchy needs structured improvement
- A frontend implementation works but doesn't hold up at different breakpoints

---

## Execution Workflow

### Phase 1: Inspect Current State

1. Read all markup, CSS/Tailwind, and component logic for the target UI
2. Open or reconstruct what the current output looks like
3. Identify the key user intent: what should the user's eye go to first? What is the primary action?
4. List the concrete problems: layout issues, spacing inconsistencies, hierarchy confusion, broken responsiveness

Do not write any code in this phase. Understand before acting.

**Output:** Specific list of UI issues, ordered by impact

---

### Phase 2: Fix Structure First

1. Address layout problems before cosmetic concerns
2. Verify the container/grid/flex structure is semantically and functionally correct
3. Fix any elements that are out of DOM order for accessibility
4. Fix the mobile breakpoint before worrying about desktop polish

**Rule:** You cannot fix spacing issues on a broken layout. Structure always comes first.

**Output:** Correct structural foundation

---

### Phase 3: Establish Visual Hierarchy

1. Ensure the primary headline/CTA is visually dominant
2. Reduce visual noise — not everything can be bold, large, or high-contrast
3. Apply consistent spacing using a defined scale (not arbitrary pixel values)
4. Ensure secondary elements visually recede from primary ones

**Output:** Clear visual hierarchy where the user's attention is guided correctly

---

### Phase 4: Polish and Responsiveness

1. Verify the UI at: 375px (mobile), 768px (tablet), 1280px+ (desktop)
2. Tighten spacing — production UIs are usually tighter than first drafts
3. Ensure interactive elements have hover and focus states
4. Check typography: heading/body weight contrast, line-height, and max-width readability
5. Remove any unused classes, debug styles, or placeholder content

**Output:** Production-quality, responsive UI

---

### Phase 5: Final Review

1. Review the full page in context — not just the component in isolation
2. Check that the UI communicates what it needs to communicate clearly
3. Verify that empty states, loading states, and error states are handled if they exist
4. Confirm no regressions in adjacent components
5. **Apply completion gate from `rules/done-criteria.md` (Website / Landing Page section).**

**Output:** Ship-ready UI with all states handled

---

## Output Expectations

- A full list of changes made with rationale for significant decisions
- Confirmation of responsive behavior at all target breakpoints
- Any remaining issues that are out of scope for this pass, flagged explicitly

---

## Constraints

- Do not add animation if it doesn't serve the user's task
- Do not introduce new dependencies (icon libraries, component libraries) without justification
- Do not ship if the mobile breakpoint is broken
- Do not confuse "looks different from Figma" with "is wrong" — implementation must be correct, not pixel-perfect
- Accessibility is not optional: focus states, semantic HTML, and contrast must be correct

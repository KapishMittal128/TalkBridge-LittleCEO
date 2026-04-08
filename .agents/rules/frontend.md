# Rule: Frontend Engineering Standards

## Scope

All frontend code: HTML markup, CSS, JavaScript/TypeScript components, and state management across frameworks (React, Next.js, vanilla).

---

## Standards

Good frontend code is:
- Semantically correct HTML that communicates meaning to browsers, assistants, and accessibility tools
- Layout-stable across real viewport sizes (375px → 1440px+)
- Visually hierarchical — the most important element is visually dominant, not buried
- Component-isolated — components do not leak styles or state into siblings
- Implementation-realistic — it works in a real browser under real network conditions

---

## Required Practices

**Structure:**
- Use semantic HTML elements: `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`, `<button>`, `<a>` — never `<div>` for interactive elements
- One `<h1>` per page; heading hierarchy must be logical (`h1 → h2 → h3`)
- Forms must use `<label>` elements with `htmlFor` / `for` associations

**Layout:**
- Use CSS Grid for two-dimensional layouts, Flexbox for one-dimensional
- Mobile-first: define base styles for mobile, then add breakpoints upward
- Use spacing from a defined scale — do not use arbitrary `px` values inline
- Max-width containers on reading-heavy content (typically `max-w-3xl` or `prose`)

**Interactivity:**
- All interactive elements (`button`, `a`, inputs) must have visible `:focus` states
- Hover effects should hint affordance — they should not be the only indicator
- Loading, empty, and error states must exist for every data-dependent view

**Components:**
- Each component has one clear responsibility
- Props must be typed — no untyped component APIs
- Avoid deep prop drilling — lift state or use context only when genuinely shared

---

## Forbidden Patterns

- `<div onClick>` instead of `<button>` — incorrect semantics and inaccessible
- Hardcoded hex colors outside a theme/token system
- CSS `!important` without an explicit comment explaining why
- Inline styles for layout decisions
- Class names that describe visual appearance (`red-text`) instead of semantic role (`error-message`)
- Components that reach outside themselves to mutate siblings or parent DOM nodes
- Using a full UI component library to render a single button

---

## Review Checklist

- [ ] Markup uses semantic elements correctly
- [ ] Layout holds at 375px and 1280px
- [ ] All interactive elements have focus styles
- [ ] No hardcoded color or spacing values outside the token system
- [ ] Loading, empty, and error states are handled
- [ ] No `<div onClick>` anti-pattern
- [ ] Component props are fully typed

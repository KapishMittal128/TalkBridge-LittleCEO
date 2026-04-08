# Rule: Project Structure Standards

## Scope

File organization, folder structure, naming conventions, and module boundaries across the entire project. Applies to any framework or language.

---

## Standards

A good project structure is:
- Navigable: a new developer finds files where they expect them
- Flat where possible: deep nesting obscures structure
- Role-consistent: files in a folder do the same kind of thing
- Named for what they contain, not what they do conceptually

---

## Required Practices

**General Organization (Next.js / Node.js example):**
```
src/
  app/           # Next.js App Router pages and layouts
  components/    # Shared UI components
  features/      # Feature-grouped modules (collocate related logic)
    auth/
      components/
      hooks/
      actions.ts
      types.ts
  lib/           # Shared utilities and service clients
  hooks/         # Shared React hooks
  types/         # Shared TypeScript types
  styles/        # Global CSS and design tokens
```

**For APIs / Backend:**
```
src/
  routes/        # Route definitions only — thin handlers
  services/      # Business logic
  repositories/  # Data access layer
  middleware/    # Express/Fastify middleware
  lib/           # Shared utilities, clients
  types/         # Shared TypeScript types
```

**Feature Collocation:**
- Group related files by feature first, layer second
- Keep a feature's components, hooks, types, and service logic near each other
- Only promote to shared `components/` or `lib/` when used by 2+ features

**Naming:**
- Directories: `kebab-case` — `user-profile`, `order-management`
- React components: `PascalCase.tsx` — `UserCard.tsx`, `OrderTable.tsx`
- Utilities and hooks: `camelCase.ts` — `formatDate.ts`, `useAuth.ts`
- Constants: `SCREAMING_SNAKE_CASE` for true constants — `MAX_RETRY_COUNT`
- Test files: co-locate with source — `UserCard.test.tsx` next to `UserCard.tsx`

**File Size:**
- If a file exceeds ~300 lines, consider whether it has more than one responsibility
- A component file with 500+ lines is almost certainly doing too much
- Extract when there is a semantic reason — not just to reduce line count

---

## Forbidden Patterns

- Single `utils.ts` file that accumulates every one-off helper
- A `components/` folder with 80 unrelated components and no sub-organization
- Files named `helpers.ts`, `misc.ts`, `stuff.ts`, `common.ts`
- Deeply nested directories: `src/modules/user/profile/settings/form/fields/` is too deep
- Mixing client and server code in a single file without explicit boundaries
- Index barrel files that re-export everything from a feature (causes bundle bloat and circular dependencies)
- Test files in a separate `__tests__/` directory far from the source they test

---

## Review Checklist

- [ ] New files are in the correct folder by their role
- [ ] Naming conventions followed (kebab-case dirs, PascalCase components, camelCase utilities)
- [ ] No new `utils.ts` / `helpers.ts` catch-all files
- [ ] Features are collocated where the feature has >1 file
- [ ] Shared code is not duplicated across features
- [ ] No file exceeds ~300 lines without justification

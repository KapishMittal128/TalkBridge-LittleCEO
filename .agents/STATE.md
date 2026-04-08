# STATE.md — Project Memory

> **This file is strategic memory, not a changelog.**
> It records durable decisions that a future session needs to know.
> It does NOT record activity, temporary notes, or debugging steps.

## Write Protocol

**WRITE here when:**
- A technology, framework, or library is chosen or changed
- An architectural boundary or layering decision is locked in
- An important constraint is discovered that affects future work
- A naming or structural convention is established project-wide
- A major phase completes and the outcome affects future decisions
- A root cause is found that permanently changes how a subsystem works

**DO NOT write here for:**
- Temporary TODOs or single-session implementation notes
- Minor edits confined to one file
- Debugging hypotheses and transient experiments
- Anything that belongs in a code comment instead

> **Gut check before writing:** *"Will a future session with zero memory of today need this?"*
> Yes → write it. No → skip it. A bloated STATE.md is worse than no STATE.md.

---

## Project Identity

| Field | Value |
|-------|-------|
| **Project name** | *(fill in)* |
| **Type** | *(web app / API / CLI / library / monolith / microservice)* |
| **Primary language** | *(TypeScript / Python / Go / etc.)* |
| **Framework** | *(Next.js / FastAPI / Express / etc.)* |
| **Database** | *(PostgreSQL / MongoDB / SQLite / none)* |
| **Auth** | *(JWT / sessions / OAuth / Clerk / none)* |
| **Deployment target** | *(Vercel / Railway / Docker / AWS / etc.)* |
| **OS last reviewed** | *(date)* |

---

## Active Tech Decisions

Record decisions that must not be reversed without explicit discussion.

```
[DATE] Decision: Using Prisma (not Drizzle) for ORM
       Reason: Existing schema migrations already in Prisma format
       Trade-off: Slightly slower raw query ergonomics accepted

[DATE] Decision: App Router (Next.js), not Pages Router
       Reason: Greenfield project, App Router is the current standard
       Trade-off: Some ecosystem libraries not yet fully compatible

[DATE] Decision: Zod for all input validation (server and client)
       Reason: Single shared schema definition, type-safe
```

---

## Current Architecture

Describe the high-level shape of the system in plain terms.
Update this section when the architecture changes.

```
(Example)
src/
  app/          → Next.js App Router pages
  features/     → Feature-grouped modules (auth, billing, dashboard)
  lib/          → Shared utilities, API clients, config
  components/   → Shared UI components only

Key boundaries:
- No DB queries outside of src/features/<feature>/repository.ts
- All external API calls wrapped in src/lib/clients/<service>.ts
- No business logic in route handlers
```

---

## Work In Progress

Track the current state of active work to prevent session context loss.

```
[DATE] Started: User auth flow implementation
       Phase: Service layer complete, route handlers in progress
       Blocked on: Need to decide on session vs. JWT

[DATE] Completed: Database schema v1
       Result: users, orders, products tables with all FK constraints and indexes
```

---

## Known Constraints & Gotchas

Record non-obvious facts about this project that would trip up a new session.

```
(Example)
- The `user_id` column in `events` table is nullable (legacy data — do not change)
- Stripe webhooks require raw body parsing — applying express.json() middleware breaks them
- The staging environment uses a shared Postgres instance — do not run migrate reset
- Environment variable NEXT_PUBLIC_API_URL must include trailing slash
```

---

## Decisions That Need Revisiting

Flag unresolved or temporary decisions that should be revisited.

```
(Example)
[DATE] TEMPORARY: Using localStorage for auth token (should move to httpOnly cookies before launch)
[DATE] DEFERRED: No rate limiting on /api/search — acceptable for MVP, required before public launch
```

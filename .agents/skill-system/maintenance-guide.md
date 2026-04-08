# Skill Maintenance Guide

Skills are living documents. The technology they describe evolves. A skill that was accurate in 2024 may recommend deprecated patterns in 2026. This guide defines the maintenance protocol for keeping the skill library current without creating bloat.

---

## Freshness Rule

**A skill's `verified_date` is a selection signal, not a maintenance trigger.**

If a skill's `verified_date` is older than 12 months:
- It is not automatically refreshed
- It does not trigger a review task
- It signals: *"check before relying on this if the technology moves fast"*

"Stale" does not mean "wrong" — many skills cover stable patterns that do not change (REST design, SQL normalization, SOLID principles). Freshness matters most for skills covering fast-moving frameworks and SDKs.

---

## When to Refresh a Skill (Relevance-Driven)

A skill is only refreshed when it is **actively selected for a task** and one of these is true:

1. Its code examples reference APIs, functions, or options that no longer exist
2. It recommends a pattern the current stack has deprecated
3. It conflicts with how the project is actually built (creating confusion, not clarity)
4. It is producing degraded or incorrect outputs in practice

**If none of these are true, do not refresh the skill.** A skill that is slightly old but still accurate is fine. A skill that is technically current but provides no value is not.

### What NOT to do

- Do not audit the skill library for staleness on a schedule
- Do not refresh skills nobody is using
- Do not run `grep -r verified_date` unprompted and create a work queue from it
- Do not treat maintenance as a form of productivity

The maintenance system is passive and relevance-driven. It activates when a skill is selected and found to be wrong — not before.

---

## What Changes Across Framework Versions

The most likely things to become stale:

| Technology | What Typically Changes |
|-----------|----------------------|
| Next.js | Router model (App vs Pages), Server Components patterns, data fetching APIs |
| React | Hooks patterns, Suspense behavior, concurrent features |
| Prisma / Drizzle | Schema syntax, migration commands, type generation |
| FastAPI | Pydantic v1 vs v2 validation APIs (major break) |
| Auth.js / NextAuth | v4 vs v5 API surface changes |
| Tailwind | Class naming, configuration format |
| OpenAI / Anthropic SDKs | Breaking changes on major version bumps |
| Docker | Build syntax changes (BuildKit) |

---

## Deprecation Protocol

When a skill becomes fundamentally outdated (the technology it covers is no longer recommended):

1. Do NOT delete it immediately — it may still be used in existing projects
2. Add a deprecation notice at the top:
   ```
   > ⚠️ DEPRECATED as of [DATE]. Reason: [e.g., "Next.js Pages Router is legacy — see nextjs-patterns for App Router"].
   > This skill is retained for legacy project support only.
   ```
3. Update the YAML frontmatter:
   ```yaml
   deprecated: true
   deprecated_reason: "Replaced by nextjs-patterns (App Router)"
   deprecated_date: "2026-01-01"
   ```
4. Create or update the replacement skill

---

## Adding New Skills

When the ecosystem adds something genuinely new that isn't covered:

1. Check `.agents/skills/` — does any existing skill cover this?
2. Check `skill-system/category-map.md` — which category does this belong to?
3. Use `skill-system/skill-template.md` to create the new skill
4. Set `verified_date` to today
5. Set `version` to `"1.0"`
6. Add to the relevant category in `category-map.md`

Do NOT create a new skill for a minor variation of an existing one (e.g., "postgres-best-practices-for-saas" if postgres-best-practices already covers SaaS scenarios).

---

## Maintenance Log

Track reviews here for visibility:

| Date | Skill | Action | Updated Version |
|------|-------|--------|----------------|
| *(date)* | *(skill-name)* | *(reviewed / updated / deprecated)* | *(new version)* |

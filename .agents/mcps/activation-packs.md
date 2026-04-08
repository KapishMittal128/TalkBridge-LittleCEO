# MCP Activation Packs — Antigravity OS

These packs define which MCPs should be active per task type.
Reference these from `tools.md` Section 5 (Minimal MCP Packs) when selecting tools.

---

## Website Clone Pack
**Use when:** Cloning, analyzing, or recreating an existing website
- `playwright` — open, inspect, interact with the live site
- `firecrawl` — crawl and extract structured content
- `filesystem` — write the recreated code
- `21st-dev-magic` — source modern UI components

## Frontend Build Pack
**Use when:** Building landing pages, dashboards, or SaaS UIs
- `filesystem` — read/write project files
- `21st-dev-magic` — source production-ready UI components
- `playwright` — test and visually verify the output

## Backend Build Pack
**Use when:** Building APIs, services, or database logic
- `filesystem` — read/write project files
- `supabase` — database, auth, and storage management
- `postgres` — direct SQL and schema operations

## Fullstack Pack
**Use when:** End-to-end app development
- `filesystem` — project file management
- `supabase` — backend infrastructure
- `21st-dev-magic` — UI components
- `playwright` — E2E testing and visual verification

## Debug Pack
**Use when:** Investigating and fixing bugs
- `filesystem` — read logs, configs, and source code
- `playwright` — reproduce frontend bugs in-browser
- `sqlite` — inspect local database state

## Research Pack
**Use when:** Technical research, documentation lookup, competitive analysis
- `firecrawl` — crawl and extract website content
- `playwright` — browse and inspect live pages

## Deployment Pack
**Use when:** Preparing for production launch
- `filesystem` — verify build output and configs
- `github` — commit, push, and manage releases
- `supabase` — verify production database state

## Automation Pack
**Use when:** Setting up workflows, integrations, or scheduled tasks
- `github` — repo hooks and CI/CD integration
- `supabase` — edge functions and triggers
- `memory` — persist workflow state across sessions

---

**Protocol:** Activate only the pack matching the current task. Do not mix packs.

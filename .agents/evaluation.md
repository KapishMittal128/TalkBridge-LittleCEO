# evaluation.md — Antigravity OS: Internal Product Assessment

**Current Version: v2.2.0** (Updated April 2026)

### Version History / Changelog

**v2.2.0 (Current)**
- **Precision Skill Integration:** Surgical addition of `playwright-e2e-testing`, `secure-coding-patterns`, and `decision-redteam` (The Fool) to fill strategic capability gaps.
- **MCP Control Layer:** Introduced `tools.md` v2 for hard tool discipline, task-based classification, and token efficiency optimization.
- **Structural Hardening:** Established `rules/done-criteria.md` as a mandatory completion gate for all task types.
- **Decision Priority:** Codified a 6-level Tradeoff Priority in `AGENTS.md` (Correctness > Simplicity > Maintainability) to standardize architectural judgment.
- **ML Capability Patch:** Surgical addition of `ml-system-builder` and `ml-evaluation-checklist` to enable product-grade ML engineering and evaluation.


**v2.1.0 (Current)**
- **System Hardening:** Added `/research` command for structured tradeoff decisions, implemented "Not My Job" boundaries on all 6 agents.
- **Workflow:** Added Session Continuity Rule (STATE.md check), Hook Failure Route mapping, and No-Op detection parameters.
- **New Skills:** Introduced `mobile-first-ux`, `typescript-patterns`, `modern-ui-aesthetics`, `conversion-copywriting`, and `framer-motion-choreo` to support high-end real-world product execution.

**v2.0.0**
- **Architectural Shift:** Introduced 4-tier Command Safety protocol, strict STATE.md strategic memory rules (no bloat), Context Lazy Load system, and the Complexity Gate / Fast Path.
- **Skill Operations:** Introduced relevance-driven skill maintenance and complete standardization of skill templates.

---

## 1. What This OS Is

The `.agents` directory is a structured configuration layer that governs how Antigravity behaves inside a project. It is not a collection of prompts. It is not a prettified folder of markdown files.

It is a **behavioral specification** — a set of rules, roles, workflows, and constraints that transforms Antigravity from a generic AI assistant into a disciplined engineering system.

The OS defines:
- **Which skills get loaded** (and which get ignored)
- **Which workflow to follow** depending on task complexity
- **Which agents to activate** for each category of work
- **Which commands to block**, which to propose, and which to auto-run
- **What gets written to project memory** and what gets discarded
- **What constitutes good output** and when output is not ready to ship

The result is an AI that behaves like a senior engineer rather than an eager assistant.

---

## 2. Core Strengths

### Complexity Gate + Fast Path
The OS is self-routing. Every request is classified before any work begins. Simple tasks bypass the full workflow and execute immediately. Complex tasks activate the structured workflow. Tasks in between are evaluated with an explicit anti-overkill check: *can this be done in one file, one pass, under ~15 minutes?* If yes — Fast Path unless the task is destructive or ambiguous.

This means the OS never over-processes a simple request and never under-structures a complex one.

### Lazy Load Protocol
Skills, agents, and rules are loaded on-demand — not preloaded at session start. The maximum is 3 skills for a complex task, 2 for a simple one, 0 for trivial tasks. This keeps the context window clean and prevents the AI from "knowing too much" about irrelevant concerns while working on a specific problem.

Every item loaded into context has a cost. The OS keeps that cost minimal and intentional.

### Structured Execution (Full Workflow)
For non-trivial tasks, the OS enforces a fixed sequence: PLAN → INSPECT → SELECT → EXECUTE → VERIFY → REVIEW. Each phase has a specific purpose. Skipping INSPECT to get to EXECUTE faster is explicitly prohibited — because building on unverified assumptions is the most common cause of rework.

The workflow is not bureaucratic. It is the sequence that produces correct results.

### 4-Tier Command Safety
Terminal commands are classified into four tiers:
- **Tier 1** (auto-run): safe reads and standard dev ops
- **Tier 2** (propose first): dependency installs, commits, migrations
- **Tier 3** (explicit approval): history-modifying, production-touching, external network
- **Tier 4** (permanently blocked): destructive commands, secret reads, force pushes

The OS never asks for permission to run `git status`. It never silently runs `rm -rf`. The line between safe and unsafe is explicitly drawn.

### Project State Memory (STATE.md)
The OS maintains a project memory file that preserves architectural decisions, established constraints, and known project-specific gotchas across sessions. Antigravity will not re-derive the wrong answer to a decision that was already made.

Critically — STATE.md has strict write discipline. It records only durable, strategic decisions. Temporary notes, debugging steps, and minor implementation details do not belong there. A clear gut-check test (`"Will a future session with zero memory of today need this?"`) governs every write decision.

### Relevance-Driven Skill Freshness
Skills include a `verified_date`. A stale skill is not automatically refreshed — it is a caution signal during selection. Skills are only updated when they are actively being used and their guidance appears incorrect or outdated. There is no maintenance queue, no upkeep schedule, no fake ceremony.

### Skill System (`.agents/skill-system/`)
The OS includes a complete system for creating, importing, and normalizing skills. New skills follow a strict template with required fields. The import playbook, conversion guide, category map, and description guide ensure that every new skill meets the same quality bar as the existing library.

---

## 3. Why This Is Better Than a Loose AI Workspace

A typical AI session has no structure beyond the user's prompt. The AI:
- Loads everything it can find into context
- Decides ad-hoc what to do and in what order
- Makes no distinction between trivial and complex tasks
- Has no memory of decisions made in previous sessions
- Has no constraints on which commands it can run
- Has no consistent quality standard it enforces before delivering

The `.agents` OS solves every one of these. Each session starts with a defined routing decision, a defined selection protocol, a defined execution sequence, and a defined delivery standard. The behavior is consistent regardless of what the user asks.

A loose AI workspace produces output that varies dramatically in quality. The OS produces output that is consistently structured, minimal, and verified.

---

## 4. Practical User Benefits

**Better focus** — The AI does not load irrelevant skills or read the entire codebase before answering a scoped question.

**Less context waste** — The lazy load protocol keeps the working context tight. The AI is thinking about your problem, not maintaining awareness of 32 skills simultaneously.

**Cleaner outputs** — The output quality standard, the anti-bloat rules, and the post-execution review phase combine to eliminate generic filler, vague plans, and unverified implementations.

**Fewer dumb actions** — The 4-tier command protocol prevents accidental destructive operations. The Complexity Gate prevents over-engineering a simple request. The anti-overkill clause prevents the AI from inventing structure it doesn't need.

**Project continuity** — STATE.md means the AI carries the context of key project decisions across sessions without needing the user to re-explain the architecture every time.

**Reusability** — The entire `.agents/` directory is a portable template. Copy it into any project and the OS applies immediately. No reconfiguration needed.

---

## 5. Design Tradeoffs

The OS is built around constraints. Constraints mean tradeoffs.

**The structured workflow adds overhead for mid-complexity tasks.** A task that is clearly not trivial but also clearly not architectural *will* go through the full workflow. The Anti-Overkill Check and Fast Path default mitigate this significantly, but some judgment calls fall in a grey zone. The design accepts a small amount of overhead on these cases in exchange for never under-processing a genuinely complex task.

**STATE.md requires discipline to remain useful.** It is only as good as what gets written to it. If users skip maintaining it, the project memory benefit does not materialize. The write protocol and gut-check question help — but the file requires active use.

**Skills require periodic human judgment.** The freshness system is passive and relevance-driven. It will not invent maintenance work. But when a skill's guidance genuinely needs updating, a human (or the agent under active instruction) must recognize that and make the call. The OS facilitates this; it does not automate it.

These tradeoffs are intentional. The OS is designed to be lean and practical, not automatic and bureaucratic. Every overhead that was removed required a judgment call — and those calls consistently favored execution speed and signal quality over system complexity.

---

## 6. Installed Skills Library

The OS currently includes **40 specialized skills** (see `skills/CAPABILITIES.md` for the index) that can be lazy-loaded depending on project needs.

**Design & UI (The "Igloo Inc" Tier)**
- `modern-ui-aesthetics` — High-end SaaS tropes (bento grids, glassmorphism, precise type)
- `framer-motion-choreo` — Choreographed entrance animations and layout transitions
- `frontend-design` — Structural frontend implementation
- `uxui-principles` — Core user experience laws
- `product-design-thinking` — Product strategy and user flow modeling
- `landing-page-builder` — Standard landing page structure
- `saas-dashboard-builder` — Layouts for complex web apps

**Growth & Copy**
- `conversion-copywriting` — Structured, outcome-focused SaaS messaging
- `launch-copywriting` — High-urgency launch material
- `seo-audit-workflow` — On-page SEO fundamentals

**Architecture & Backend**
- `api-design-principles` — RESTful routing and payload design
- `architecture` — General system layout
- `auth-flow-patterns` — Session and JWT secure flows
- `backend-dev-guidelines` — Service layer and controller discipline
- `database-design` — Relational modeling and constraints
- `fastapi-patterns` — Python FastAPI standards
- `postgres-best-practices` — Indexing and advanced Postgres
- `secure-coding-patterns` — Authentication, encryption, and secure input
- `sql-query-optimizer` — Performance tuning
- `system-architecture` — Cloud architecture and scaling
- `webhook-patterns` — Event-driven async design

**Machine Learning (AI & ML Core)**
- `ml-system-builder` — Building complete ML products (audio, classifiers, prediction)
- `ml-evaluation-checklist` — Anti-slop model validation and error analysis

**Frontend Frameworks**
- `nextjs-patterns` — App Router, Server Components
- `react-best-practices` — Hooks, Suspense, state management

**Workflow & Quality**
- `brainstorming` — Unconstrained ideation before planning
- `code-refactoring` — Safe transformation techniques
- `debugging-workflow` — Standard debug loops
- `decision-redteam` — Structured critical reasoning and Devil's advocate
- `deployment-workflow` — Go-live checklists
- `error-detective` — Deep root-cause isolation
- `github-actions-ci-cd` — Pipeline construction
- `micro-saas-launcher` — Fast scaffolding and scoping
- `playwright-e2e-testing` — E2E testing setups and browser automation
- `production-code-audit` — Pre-launch security/performance checks
- `repo-analysis` — Understanding legacy codebases
- `spec-driven-build` — Building strictly to spec limits
- `systematic-debugging` — Scientific method for bug squashing
- `testing-patterns` — Unit and integration test standards
- `vibe-code-auditor` — AI-specific code style checks

---

## 7. Website Building Capability (The Reality Check)

**Can this OS build sites that look and feel like modern SaaS leaders (e.g., Igloo Inc, Vercel, Stripe)?**

**Yes. It is now completely capable of this.**

Before adding the three high-end design skills, the OS was an elite structural engineer but a mediocre art director. It would build semantically perfect, un-animated, generic sites.

By adding `modern-ui-aesthetics`, `framer-motion-choreo`, and `conversion-copywriting`, the capability ceiling of this OS shifts from "clean prototype" to "production launch."

When invoked for a landing page, the OS will now:
1. Format with deep backgrounds, glassmorphism, and bento grids instead of plain boxes.
2. Choreograph staggered Framer Motion entry animations rather than letting the page load statically.
3. Write punchy, outcome-based hero copy instead of "Welcome to our powerful platform."

It combines strict engineering discipline (`rules/frontend.md`) with explicit elite design instruction (the new skills). The result is an AI that doesn't just write HTML — it crafts product experiences.

---

## 8. Final Verdict

This is a **disciplined, production-ready AI operating system** for software engineering work.

It is:
- **Reusable** — works across any project by copying one folder
- **High-signal** — minimal context waste, maximum relevant focus
- **Anti-bloat by design** — every rule exists to make outputs better, not to add process for its own sake
- **Safe** — tiered command control prevents destructive accidents
- **Honest about complexity** — trivial tasks are trivial, complex tasks get structure, and the line between them is explicit
- **Design-capable** — bridges the gap from engineering to elite product design via specialized UI skills

It will not make Antigravity omniscient. It will make Antigravity consistently sharp, structurally disciplined, and significantly more useful across real engineering work than any unconstrained AI session.

That is what it was built to do.

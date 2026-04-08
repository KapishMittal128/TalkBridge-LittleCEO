---
name: [skill-name-in-kebab-case]
description: [Action-oriented description. Starts with an active verb. Explain exactly what this skill does and the specific scenarios where the agent should use it. MUST include the phrase "Use when" followed by 3+ specific triggers.]
version: "1.0"
verified_date: [YYYY-MM-DD]
category: [core | frontend | backend | api | database | integrations | infra | research | design | growth]
---

# [Readable Skill Name]

## Purpose

[1-2 sentences explaining why this skill exists and what value it provides over generic intelligence. Be specific — "helps you write better code" is not a valid Purpose statement.]

## When to Use This Skill

- [Specific scenario A — e.g., "Reviewing TypeScript code for architectural violations"]
- [Specific scenario B]
- [Warning/when NOT to use it — e.g., "Do NOT use for greenfield architecture decisions"]

---

## Phase 1: [First Logical Step]

[Clear, markdown-formatted instructions for the first step]
- Bullet points with concrete actions
- Code blocks where they show the pattern
- Explicit constraints ("never do X", "always do Y")

## Phase 2: [Next Logical Step]

[Continue phases as needed — typically 2-4 phases per skill]

---

## Output Format / Delivery

[Specify exactly how results should be delivered:
- "Write findings to an artifact at /path/report.md"
- "Apply changes directly to the relevant files"
- "Return a structured checklist"
]

---

## Behavior Rules

- [Strict constraint 1 — e.g., "Never overwrite production data without explicit approval"]
- [Strict constraint 2 — e.g., "Report findings before making changes"]
- [Strict constraint 3]

---

## Maintenance Notes

> **Freshness check:** If `verified_date` is more than 12 months ago, flag this skill for review.
> Key APIs, library versions, or ecosystem patterns may have changed.
> Use `.agents/skill-system/maintenance-guide.md` to update this skill.

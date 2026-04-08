# Command: /research

## Purpose

Provides a structured workflow for deep technical research. Converts vague evaluation tasks into a disciplined, evidence-based recommendation. Replaces the default AI behavior of dumping information with no synthesis.

---

## When to Use

Use `/research` for:
- Technology selection between multiple options (e.g., "Prisma vs Drizzle")
- Library or framework evaluation
- Architecture pattern comparison
- API or service tradeoff analysis
- "Should we use X or Y?" decisions with real stakes

Do NOT use `/research` for:
- Simple factual lookups ("What does `useEffect` do?")
- Trivial questions with a clear answer
- Anything resolvable in one sentence

If the question is answerable without research, answer it directly. Do not invoke this command.

---

## Execution Phases

### Phase 1 — Define the Question
State the exact research question in one sentence.
- Must be answerable with a concrete recommendation
- Must not be a topic to "explore" — it is a decision to make
- Example: "Which ORM should we use for this Next.js + PostgreSQL project: Prisma or Drizzle?"

### Phase 2 — Scope the Constraints
Before gathering data, define what matters for *this specific context*:
- What are the hard constraints? (e.g., team experience, deployment target, performance requirements)
- What is the evaluation horizon? (proof-of-concept vs. 3-year production system)
- What dimensions matter? (DX, performance, community, type safety, migration story)
- What dimensions do NOT matter? (do not evaluate irrelevant axes)

### Phase 3 — Gather Sources
Identify evidence from at least 3 credible sources or data points:
- Official documentation
- Benchmark comparisons (if performance matters)
- Known production use cases
- Known failure modes or ecosystem issues
- Release cadence and maintenance status

Do NOT make up sources. Do NOT cite vague "community consensus."

### Phase 4 — Extract Key Data
For each option being compared, extract:
- Core mechanism (how it works)
- Actual strengths in this specific context
- Actual weaknesses in this specific context
- Deal-breaker risks if any

### Phase 5 — Compare Options
Produce a structured comparison table:

| Dimension | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| [relevant axis] | ... | ... | ... |

Only include dimensions relevant to the defined constraints from Phase 2.

### Phase 6 — Identify Tradeoffs
State the real tradeoffs explicitly:
- What does Option A win on?
- What does Option B win on?
- Will those differences matter at the scale and context of this project?
- Are there any non-obvious risks in either direction?

### Phase 7 — Form a Recommendation
State a single clear recommendation with a brief justification.

Format:
```
RECOMMENDATION: [Option X]
REASON: [2-3 sentences explaining why, based on Phase 2 constraints]
RISK: [One honest risk of this choice]
```

If a single recommendation is genuinely not possible, explain exactly what decision is blocking it and ask for clarification. Do not leave this phase as "it depends."

### Phase 8 — Deliver Structured Answer
Deliver the full output in this structure:
1. **Question** — restated from Phase 1
2. **Context** — key constraints from Phase 2
3. **Comparison Table** — from Phase 5
4. **Tradeoffs** — from Phase 6
5. **Recommendation** — from Phase 7
6. **Next Step** — the immediate action to act on this recommendation
7. **Apply completion gate from `rules/done-criteria.md` (Research Output section).**

---

## Behavior Rules

- Never dump raw information without synthesis
- Never give a "here are your options" answer without a recommendation
- Never say "it depends" without immediately providing the structure to resolve the dependency
- Never evaluate dimensions that were scoped out in Phase 2
- Never fabricate sources, data, or benchmarks

# tools.md — MCP Usage Control Layer v2

**Version: 2.0.0**
**Scope:** All projects using the Antigravity OS
**Authority:** Hard execution constraint. Not a suggestion. Not a guide.

---

## 0. Pre-Flight: Task Classification

**Before selecting any tools, classify the task.**

| Type | Description | Command |
|---|---|---|
| **Answer** | Simple Q&A — no tools needed | N/A |
| **fix-issue** | Bug fixes and regressions | `fix-issue` |
| **build-feature** | Feature development | `build-feature` |
| **ship-ui** | High-end frontend polish | `ship-ui` |
| **review-code** | Code audit and quality review | `review-code` |
| **refactor** | Code restructuring | `refactor` |
| **research** | Deep technical analysis | `research` |
| **Audit** | Security sweep — read-only | `review-code` |
| **Design** | System architecture — read-only | `research` |

**Classification determines:**
- Which tools are permitted (see Section 4)
- Which MCP pack to start with (see Section 5)
- Whether escalation applies (see Section 7)

**Rule:** Declare task type before any tool is invoked. A misclassified task is a constraint violation from the start.

---

## 1. Purpose

This file controls which MCPs are active per task.

- Prevents unnecessary tool activation
- Enforces minimal, type- and phase-appropriate toolset selection
- Reduces token consumption from exploration, scanning, and redundant calls
- Eliminates noise from available-but-irrelevant tools
- Keeps execution tightly scoped to the stated deliverable

---

## 2. Active MCPs For This Task

**Populate before starting. Leave blank = nothing is authorized.**

```
TASK TYPE:
PHASE:

ACTIVE MCPs:
- (list only explicitly approved MCPs)

ALL OTHERS: FORBIDDEN
```

**Rule:** An unlisted MCP must not be invoked, probed, or scanned — under any circumstances.

---

## 3. Operation Type: Local vs External

**Local ops are preferred. Exhaust them before reaching for an MCP.**

### Local Operations (cheap, preferred, low-risk)
- Read/write files in the workspace
- grep, search, or inspect within the codebase
- Run lightweight terminal commands
- Inspect logs, configs, or build output

**Use local ops by default.** They require no authorization gate.

### External MCP Usage (expensive, gated, restricted)
- Browser / web search MCPs
- Docs retrieval / reference MCPs
- Design system or UI reference MCPs
- Infra, deploy, or automation MCPs
- Any tool that calls an external service or API

**Use external MCPs only when local ops are provably insufficient.**

If a local op can answer the question → it must be used instead.

---

## 4. Tool Cost / Execution Preference Hierarchy

Apply in order. Stop at the lowest sufficient level.

```
1. Direct reasoning from existing knowledge
2. Existing context already in session
3. Local file read / grep / workspace inspect
4. Lightweight local terminal command
5. Approved external MCP

→ New MCP: escalate first (Section 7)
```

Every level skipped must be justified. You may not jump to level 5 if level 3 is sufficient.

Every external MCP call requires a single-sentence justification. If you cannot state it, do not call.

---

## 5. Recommended Minimal MCP Packs

Start with the smallest matching pack. Expand only via escalation.

| Task Type | Default MCP Pack |
|---|---|
| **Answer** | None — reason directly |
| **Review / Audit** | filesystem (read-only), reasoning |
| **Build — Frontend/UI** | filesystem, terminal, browser (if needed for visual check) |
| **Build — Backend** | filesystem, terminal, docs/search (if needed) |
| **Build — Fullstack** | filesystem, terminal, docs/search |
| **Debug** | filesystem, terminal, logs |
| **Research** | browser, docs/search |
| **Design** | filesystem, reasoning |
| **Launch** | filesystem, terminal, deploy MCP |
| **Rewrite** | filesystem, terminal |

**Rules:**
- Pack defines the ceiling, not the floor. Use fewer if sufficient.
- Availability of a pack tool does not authorize it.
- Browser is not in Backend/Debug packs. Do not add it without escalation.
- Docs/search is not in Rewrite/Design packs unless external reference is required.

---

## 6. MCP Usage Rules (STRICT)

These apply to every task without exception.

- Use ONLY the MCPs listed in Section 2.
- Do NOT explore unlisted MCPs to see what they do.
- Do NOT probe or "check" a tool out of curiosity — a single call is a violation.
- Do NOT pre-load, scan, or discover tool namespaces at session start.
- Do NOT switch to an unlisted tool mid-task, regardless of apparent benefit.
- Do NOT chain tools speculatively. Each call must serve a committed, declared purpose.

**Standing permanent restrictions:**
- No bulk discovery of available tool namespaces
- No speculative activation to "explore what's possible"
- No calling a tool to confirm it's working
- No using multiple search tools for the same query

---

## 7. Exploration Limits

**Default posture: act on what is known. Explore only when correctness requires it.**

- Do NOT perform broad searches to orient yourself before acting.
- Do NOT accumulate context documents before every response.
- Do NOT browse unless the task explicitly needs external data.
- Do NOT read files unrelated to the immediate execution step.
- Do NOT search for alternatives when the correct approach is already known.
- Do NOT expand scope mid-exploration: if you start exploring, the target must be specific.

**Budget rule:** Default exploration is 2-3 targeted actions before execution begins.

Additional exploration is permitted only when:
- Correctness cannot be achieved without it
- The gap in knowledge is specific and named
- Each additional action is individually justified

Broad context-gathering is not a justified reason to exceed the budget. Precision is.

---

## 8. MCP Avoid List (MANDATORY)

**Populate before starting:**

```
FORBIDDEN MCPs FOR THIS TASK:
- (explicitly list what must not be used)
```

Hard constraints. Not suggestions.

If a forbidden tool appears useful: it is still forbidden. Escalate.

---

## 9. Escalation Rule

**Escalation is required for real scope changes — not trivial decisions.**

Escalate when:
- Adding a new external MCP not already in the active list
- Changing the declared task type or phase mid-task
- Expanding deliverables beyond the original task statement
- Accessing external systems or environments not already approved

**Do NOT escalate for:**
- Local file reads, writes, or terminal commands within scope
- Switching between approved tools in the active list
- Minor implementation decisions within the declared deliverable

**Escalation behavior:**
1. STOP — do not proceed.
2. REPORT — state exactly what's needed and why the current toolset is insufficient.
3. ASK — wait for explicit approval.
4. No self-approval. No rationalizing around the constraint.

---

## 10. Anti-Patterns (FORBIDDEN)

| Anti-Pattern | Why Forbidden |
|---|---|
| Activating multiple MCPs "just in case" | Token waste, context pollution |
| Mixing Design + Backend + Infra tools in one phase | Phase contamination |
| Scanning tool namespaces to explore capabilities | Not a task objective |
| Using a tool when direct reasoning is sufficient | Tool overhead with zero upside |
| Converting a simple task into a multi-tool pipeline | Unnecessary complexity |
| Running a tool call to verify another tool call | Redundant and wasteful |
| Searching when the answer is already in context | Ignores existing knowledge |
| Treating available tools as automatically authorized | Availability ≠ authorization |
| Jumping to external MCP before exhausting local ops | Skips preference hierarchy |
| Skipping task classification to "just start" | Breaks routing discipline from the start |

---

## 11. Output Behavior Constraint

Outputs must be:
- **Scoped** — addresses the stated task only
- **Tool-minimal** — no more tool calls than necessary
- **Direct** — executes rather than explores
- **Concise** — no meta-commentary about tool decisions

Prohibited:
- Noting which tools were considered but not used
- Explaining what an MCP could have done
- Offering to expand toolset post-completion
- Adding unsolicited commentary on tool availability
- Providing deliverables beyond what was requested

Output is the result of execution. Not a record of tool deliberation.

---

## Activation Checklist

Run before every tool invocation:

```
[ ] Task type declared (Section 0)
[ ] Phase declared
[ ] Active MCP list populated (Section 2)
[ ] Forbidden MCP list populated (Section 8)
[ ] Local ops exhausted or provably insufficient (Section 3)
[ ] This tool is in the active list
[ ] This tool matches declared task type and phase
[ ] Preference hierarchy confirms this is the minimum sufficient level (Section 4)
[ ] Single-sentence justification for this specific call exists
```

If any checkbox fails → do not invoke the tool.

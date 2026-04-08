---
name: STATE_CONTINUITY
description: "Protocol for ensuring persistent memory synchronization, context continuity, and state bridging across disconnected agent sessions."
---

# STATE CONTINUITY PROTOCOL

**STATE_CONTINUITY** manages the divide between short-term execution context (the current prompt/session) and long-term architectural truth.

If the OS relies solely on the LLM's implicit context window to remember project structure, it will fail. It must rely on disk-backed state.

## 1. THE DIFFERENCE BETWEEN STATE.MD AND TASK.MD
The OS maintains two active memory structures:

*   **`STATE.md` (Strategic Memory):** Contains overarching routing logic, unchangeable architectural decisions, framework choices, primary dependencies, and domain rules. Slow to change. Never stores task checkboxes.
*   **`task.md` (Execution Memory):** Transient, session-by-session task list. Contains `[ ]`, `[/]`, `[x]` states for immediate build goals, broken down into atomic execution units.

## 2. SESSION INITIALIZATION (START)
When dropped into an active project window, the agent **MUST ALWAYS PRE-LOAD STATE**:
1. Run `view_file` on `STATE.md` (if it exists in project root).
2. Run `view_file` on `task.md`.
3. If neither exists, assume a blank-slate project and initiate the `PLANNING` phase to generate them.

## 3. SESSION CHECKPOINT (END)
Before the agent returns its final execution summary and terminates, it **MUST SYNCHRONIZE STATE**:
1. **Did architectural truth change?** (Did we eject Tailwind? Switch to Prisma? Adopt a new auth provider?). If YES -> Update `STATE.md`.
2. **Did execution progress change?** (Did we finish the nav bar? Need to defer testing to later?). If YES -> Update `task.md`.
3. **If NO synchronization occurs**, the OS explicitly warns the user that the session ended in an ephemeral state.

## 4. GUARDING STATE.MD
During active feature `BUILD`, `STATE.md` should almost never be touched. Feature-level drift should not pollute the central strategic truth document. Only domain shifts, API key structures, env demands, or dependency updates should trigger `STATE.md` edits.

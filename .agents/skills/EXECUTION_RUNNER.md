---
name: EXECUTION_RUNNER
description: "The core OS infrastructure loop. Enforces rigid checkpointing, phase locks, and anti-fatigue cycle termination to guarantee execution safety over multi-prompt tasks."
---

# EXECUTION RUNNER

**EXECUTION_RUNNER** is the central nervous system governing how the OS runs tasks over time. It sits above `SYSTEM_ORCHESTRATION.md`. It does not route skills. It forces *discipline* onto the execution lifetime.

## 1. THE TOKEN FATIGUE GOVERNOR (HARD LIMITS)
Prolonged execution within a single terminal context window creates memory drift, hallucinated parameters, and ignored boundaries. 

The Antigravity OS is governed by a **Hard Checkpoint Law**:
- If you complete a full `PLANNING` phase for a major feature, you must **STOP**, output the plan, and tell the user you are yielding for a clean context window.
- If you complete a full component `BUILD` loop, you must update `task.md` and **STOP**, requesting the user to continue in a fresh interaction if fatigue is high.
- **NEVER** attempt to execute `PLANNING -> BUILD -> AUDIT_AND_FIX -> SHIP` for a massive project in one single command chain.

## 2. THE PHASE LOCKOUT MECHANISM
Skills frequently overlap if phase boundaries aren't strictly guarded.
- **PLANNING LOCK**: If the OS is in `PLANNING` phase, the execution runner explicitly DENIES all file creations, terminal commands (beyond read/grep), and source code modifications. 
- **BUILD LOCK**: If the OS is in `BUILD` phase, it is FORBIDDEN from rewriting foundational architecture documents (e.g. `STATE.md`) until an `AUDIT` phase begins.
- **AUDIT LOCK**: Modifying production code without a test runner or linting command is forbidden during an `AUDIT`.

## 3. PHYSICAL VERIFICATION RULE
An execution step cannot be ticked as completed in `task.md` until its side effects are tangibly verified in the world.
- Did you "Update UI"? -> Cannot complete until you read the generated `app/page.tsx` or run a local build.
- You must physically use `view_file` or `run_command` (e.g., `git diff` or `grep`) before crossing a step off as `[x]`.

## 4. END-OF-SESSION OBLIGATION
When yielding control or hitting a fatigue stop:
1. Update `task.md` to show what was just done.
2. Ensure any high-level strategic truth discovered is placed into `STATE.md` (via `STATE_CONTINUITY.md` rules).
3. Explicitly state to the user: "Checkpoint reached. I am stopping here to preserve execution integrity. Request a fresh prompt to begin the next phase."

# External Skill Conversion Guide

When importing skills from other platforms (Claude Code, Cursor, generic GitHub repositories), follow this process to convert them into Antigravity-native format.

## Step 1: Strip "Agent Personas"
Other tools require telling the LLM "You are an expert developer." Antigravity does not need this.
- **Find:** `You are an expert X...`, `Act as a senior Y...`
- **Replace:** Delete entirely. Start immediately with the "Purpose" or "Phase 1" of the workflow.

## Step 2: Strip Proprietary Tool Wrappers
Other systems hardcode specific tools that Antigravity doesn't use (or handles automatically).
- **Find:** References to `<read_file>`, `<bash>`, `<replace>`, `<edit_file>`, `<terminal>`
- **Replace:** Convert to plain English instructions. E.g., change "Use `<read_file>` to look at `src/`" to "Inspect the `src/` directory to understand the layout."

## Step 3: Extract & Formatting Frontmatter
If the source prompt is a raw `.txt` or `.md` file, you must create the YAML block.
- Map the core concept to a `name:` field.
- Map the "When to use this" to the `description:` field, following the `description-guide.md`.

## Step 4: Restructure into Phases
If the external prompt is a massive wall of text:
1. Break it into logical steps (`Phase 1: X`, `Phase 2: Y`).
2. Add a `Pre-flight Checklist` if missing.
3. Move constraints to a `Behavior Rules` section at the bottom.

## Step 5: Convert Chat Prompts to Action Workflows
- **From:** "Ask the user what they want..."
- **To:** "Review the user's request and workspace context. If information is missing, define the missing parameters and ask the user for clarification."

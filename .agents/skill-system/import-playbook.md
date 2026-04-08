---
description: How to import and normalize a new skill into the Antigravity Skill System
---

# Import Playbook

This workflow guides the agent through importing a raw prompt, converting it, and saving it as an Antigravity-native skill.

## Trigger
Use this playbook when a user says: "Create a skill for X", "Import this prompt as a skill", or "Add a new skill about Y."

## Execution Steps

1. **Understand the Source Material:**
   - Review the requested topic or raw prompt provided by the user.
   - Determine which category from `category-map.md` this fits best.

2. **Draft the Frontmatter:**
   - Generate a concise `name` (kebab-case).
   - Write a `description` adhering strictly to `description-guide.md`.

3. **Normalize the Content:**
   - Apply `conversion-guide.md` and `skill-rules.md`.
   - Remove "You are an expert" personas.
   - Restructure into "Purpose", "Phase 1 / 2 / 3", and "Behavior Rules".

4. **Persist the Skill:**
   - Using the `write_to_file` tool, create the new skill at:
     `.agents/skills/[skill-name]/SKILL.md`
   - Include the YAML frontmatter at the very top.

5. **Verify:**
   - Ensure the file was created successfully.
   - Present a summary of the new skill capabilities to the user via a walkthrough.

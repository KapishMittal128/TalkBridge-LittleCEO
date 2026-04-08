# Antigravity Skill Rules

These rules dictate what makes a high-quality, Antigravity-native skill. Enforce these rules when converting, auditing, or generating new skills.

## 1. The "Anti-Slop" Policy
- **No Generics:** A skill teaching "write good code" is slop. A skill teaching "Refactor using SOLID principles in TypeScript" is valuable.
- **No Cheerleading:** Remove phrases like "You are a world-class expert." The agent is already capable. Focus on *instructions*, not *flattery*.
- **No Hallucination Prompts:** Skills must not ask the model to guess. They must instruct the model to look at facts (code, logs, documentation).

## 2. Structural Requirements
- Every skill MUST have a YAML frontmatter block with `name` and `description`.
- `name` must be kebab-case (e.g., `react-best-practices`).
- `description` must be third-person, action-oriented, and explicitly state *when* to use it.
- Every skill MUST have a "When to Use This Skill" section.
- Every skill MUST have a "Behavior Rules" section at the bottom.

## 3. Operational Logic
A good skill operates in phases. It should not look like a blob of tips.
- Use `Phase 1: [Name]`, `Phase 2: [Name]`, etc., to enforce step-by-step thinking.
- Provide checklists (`- [ ] task`) where appropriate so the agent can track progress in an Artifact.

## 4. Portability
- Do not include tool-specific wrapper commands (e.g., "Use `<anthropic-tool_use>`). Rely on Antigravity's native tools (`view_file`, `write_to_file`, `run_command`).
- Prefer absolute paths or workspace-relative paths in examples.

## 5. Artifacts over Chat
- If a skill generates a large output (a plan, a review, an audit), it must explicitly instruct the agent to use the `write_to_file` tool to create a Markdown artifact.

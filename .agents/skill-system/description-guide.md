# Skill Description Guide

The `description` field in the YAML frontmatter is the most critical part of an Antigravity skill. It is how the agent decides whether to load the skill into its context window.

## The Formula
`[Active verb phrase detailing the core capability]. Use when [comma-separated list of 3-5 specific trigger scenarios].`

## Good Examples

**Code Refactoring:**
> Apply SOLID principles, clean code patterns, and modern software engineering best practices. Use when improving code quality, reducing technical debt, making code more maintainable, or preparing legacy code for extension.

**Error Detective:**
> Search logs and codebases for error patterns, stack traces, and anomalies to identify root causes. Use when debugging production errors, tracing failures through logs, or diagnosing intermittent issues.

## Bad Examples

**Too Vague:**
> A skill for writing backend code.
*(Agent won't know if this means APIs, databases, or deploy scripts.)*

**Too Chatty (Anthropic/OpenAI style):**
> You are an expert system architecture bot designed to help the user build highly scalable systems!
*(Wastes tokens, doesn't explicitly state the trigger conditions.)*

**No Trigger Conditions:**
> Contains best practices for PostgreSQL indexing.
*(Agent might not realize it should use this when asked "Why is this query slow?")*

## Checklist
- [ ] Does it start with an active verb? (e.g., "Audit", "Generate", "Debug", "Design")
- [ ] Does it contain the literal phrase "Use when"?
- [ ] Does it list at least 3 distinct scenarios where the user might implicitly need this skill?
- [ ] Is it under 300 characters?

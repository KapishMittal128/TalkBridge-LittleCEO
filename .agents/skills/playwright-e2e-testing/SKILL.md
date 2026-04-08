---
name: playwright-e2e-testing
description: E2E testing workflows and browser automation.
---

# 1. Purpose
Write reliable visual and logic end-to-end assertions via Playwright.

# 2. When to Trigger
Writing tests, asserting user flows, setting up QA automation.

# 3. When NOT to Trigger
Unit testing purely mathematical utility functions.

# 4. Scope Boundaries
Playwright selectors, test fixtures, intercepts, browser contexts.

# 5. Operational Phase
OPERATIONAL_PHASE: BUILD

# 6. Tool / MCP Discipline
**ALLOWED_TOOLS**: run_command, mcp_playwright_*
**FORBIDDEN_TOOLS**: Modifying source code business logic to make a test pass.
**REASONING_ONLY_OK**: Execute tests and read trace output.

# 7. Required Output Format
Working test files utilizing robust 'getByRole' and data-testid locators.

# 8. Failure Mode / Risk Awareness
Flaky test writing using brittle CSS locators.

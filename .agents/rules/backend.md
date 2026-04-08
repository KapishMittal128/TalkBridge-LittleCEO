# Rule: Backend Engineering Standards

## Scope

All server-side code: API handlers, service layer logic, data access, background jobs, authentication, and external integrations in any language (Node.js, Python, Go, etc.).

---

## Standards

Good backend code is:
- Correct under all expected inputs, including malformed or adversarial ones
- Organized in clear layers with no mixing of responsibilities
- Observable — errors and important operations produce structured, searchable logs
- Resilient — external failures are handled gracefully, not ignored
- Minimal — it does exactly what is needed and nothing more

---

## Required Practices

**Layer Separation:**
- Routes / Controllers: parse request, call service, return response. Nothing else.
- Services: orchestrate business logic. No direct DB queries.
- Repositories / Data Access: all DB interaction lives here — nowhere else.
- External Clients: wrapper modules for third-party APIs. Always injectable for testing.

**Validation:**
- All external inputs (request body, query params, headers) must be validated using a schema library (Zod, Pydantic, Joi, etc.) before reaching service logic
- Validation failures return a consistent error format with a 400 status and specific field-level details

**Error Handling:**
- Every async operation must be wrapped in error handling — no unhandled promise rejections
- Use custom error classes with status codes and machine-readable error codes
- All unhandled errors must be caught by a global error handler middleware
- Never return raw internal error messages to the client

**Logging:**
- Use structured JSON logging (pino, structlog, zerolog)
- Log: requests (method, path, duration, status), errors (with full context), and important state transitions
- Never log: passwords, tokens, API keys, or PII

**Security:**
- All protected endpoints must verify authentication before executing
- Authorization must be checked at the data layer, not just the route layer
- Parameterized queries only — never string-concatenated SQL
- Rate limiting on all public-facing endpoints

---

## Forbidden Patterns

- Business logic inside route handlers
- Database queries inside service functions (directly)
- Catch blocks that log "something went wrong" and re-throw nothing useful
- `try { ... } catch {}` blocks that silently swallow errors
- Returning `res.json({ success: true })` with no data validation
- Hardcoded credentials or secrets in code
- Using `any` types to bypass type checking on request/response objects

---

## Review Checklist

- [ ] Route handlers are thin — they call a service, not implement business logic
- [ ] All inputs validated at the boundary with a schema library
- [ ] All async operations have error handling
- [ ] No sensitive data in logs
- [ ] Auth enforcement confirmed on all protected routes
- [ ] Structured logging in use
- [ ] No raw SQL string concatenation

# Rule: API Design Standards

## Scope

All API surface design: REST routes, request/response contracts, error formats, versioning, and status codes. Applies to both internal and external APIs.

---

## Standards

A good API is:
- Predictable: a developer can guess how an endpoint will behave from its name and method
- Consistent: error formats, naming conventions, and response shapes are uniform
- Explicit: input requirements and failure modes are documented and enforced
- Minimal: exposes only what is necessary

---

## Required Practices

**Route Design:**
- Use plural nouns for resource collections: `/users`, `/orders`, not `/getUser`
- HTTP method encodes the action — do not encode it in the path:
  - `GET /orders` — list orders
  - `POST /orders` — create order
  - `GET /orders/:id` — get specific order
  - `PATCH /orders/:id` — partial update
  - `DELETE /orders/:id` — delete
- Nested routes only when hierarchy is essential: `GET /users/:id/orders` (user's orders)
- Keep nesting to 2 levels max — deeper nesting is a structure smell

**Request Validation:**
- Validate all body, query, and path params at the route level
- Return `400 Bad Request` with field-level error details on validation failure
- Never silently ignore unrecognized fields — reject or strip them explicitly

**Response Shape:**
- Successful responses: `{ data: <resource or list> }`
- Error responses consistent format:
  ```json
  {
    "error": {
      "code": "MACHINE_READABLE_CODE",
      "message": "Human-readable description",
      "details": {}
    }
  }
  ```
- Never mix error and success response shapes

**Status Codes (use correctly):**
- `200` — success with body
- `201` — resource created (POST)
- `204` — success, no body (DELETE)
- `400` — bad request / validation failure
- `401` — not authenticated
- `403` — authenticated but not authorized
- `404` — resource not found
- `409` — conflict (e.g., duplicate creation)
- `422` — semantically invalid request
- `500` — internal server error (never expose internals)

**Versioning:**
- Use URL versioning for public APIs: `/v1/`, `/v2/`
- Never break existing API contracts without a version bump
- Internal APIs can skip versioning if they are not consumed externally

---

## Forbidden Patterns

- Verb-based URLs: `/getUser`, `/createOrder`, `/deleteItem`
- Returning `200 OK` for errors with an error body — use correct status codes
- Exposing database IDs as sequential integers (use UUIDs for external-facing IDs)
- Returning stack traces or internal error messages to clients
- Undocumented required fields that silently fail when missing
- Deeply nested route paths beyond 2 levels

---

## Review Checklist

- [ ] Route names are noun-based, plural, and RESTful
- [ ] HTTP methods align with the action semantics
- [ ] Response shape is consistent: `{ data: ... }` or `{ error: ... }`
- [ ] Status codes are correct
- [ ] All inputs are validated and rejection format is consistent
- [ ] No internal errors or stack traces exposed to clients
- [ ] Public endpoints are versioned

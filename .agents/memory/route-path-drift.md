---
name: Backend route paths can drift from OpenAPI spec silently
description: Mismatched Express route paths vs OpenAPI spec paths only surface as runtime 404s, not typecheck errors
---

The generated frontend hooks (`@workspace/api-client-react`) build their request URLs from
`lib/api-spec/openapi.yaml`, not from the actual Express route registration in
`artifacts/api-server/src/routes/*.ts`. If a route handler is written with a different path
than what's declared in the spec (e.g. spec says `/journal`, handler registers
`/journal-entries`), everything typechecks fine on both sides — the mismatch only shows up
as a 404 at runtime when the frontend calls the "wrong" (per-handler) URL.

**Why:** Found this via an end-to-end browser test (journal entry creation failed with a
404 even though frontend and backend both typechecked clean).

**How to apply:** When adding or reviewing a new resource's routes, diff the Express
`router.<verb>("/path", ...)` calls against the `openapi.yaml` path keys for that resource
to confirm they match exactly, especially for less obvious resource names.

---
name: Body-trusted ownership fields
description: Routes that accept an owner/teacher id from the request body instead of the session let any authenticated user impersonate or edit someone else's rows.
---

Found in GuruEOB5's `subjects`, `documents`, and `journal` routes: `POST /subjects` accepted `teacherId` straight from the client body and inserted it as-is; `PATCH/DELETE /subjects/:id`, `DELETE /documents/:id`, and `DELETE /journal/:id` had no ownership check in their `where` clause at all, so any authenticated teacher could read, edit, or delete any other teacher's subjects/documents/journal entries. `GET /documents` and `GET /journal` also returned every row in the table when no `subjectId` query param was passed, instead of scoping to the caller.

**Why:** Zod request-body schemas generated from OpenAPI often include an owner/tenant id field (e.g. because the DB column is `NOT NULL`), but that does not mean the field is safe to trust from the client. If a handler does `db.insert(table).values(parsed.data)` or `db.update(table).set(parsed.data).where(eq(table.id, id))` without also filtering/overriding by the session's user id, it's an authz hole, not just an odd API design choice.

**How to apply:** When reviewing or writing any route that reads a body schema containing an owner/tenant id field (`teacherId`, `userId`, `ownerId`, `school`, etc.):
- On create: never spread body values directly into `.values()` if one of those fields exists in the schema — always override it with the value derived from `getCurrentGuru(req)` / session.
- On update/delete: the `where` clause must always include the ownership predicate (`eq(table.teacherId, guru.id)`), not just the row id — a mismatch on this predicate lets anyone mutate anyone else's rows by guessing/enumerating ids.
- On list without a filter param: default to scoping by the caller's ownership, never fall through to `db.select().from(table)` with no `where` at all.
- Where ownership is transitive (e.g. `documents`/`journal` reference `subjects.teacherId` rather than storing it directly), join through the owning table to check ownership before allowing the operation.

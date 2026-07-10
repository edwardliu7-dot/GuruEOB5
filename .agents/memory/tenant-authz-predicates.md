---
name: Tenant/ownership authz predicates
description: How to write authorization checks for scoped mutations (prosem, academic calendars/weeks, students, etc.) so they can't be bypassed.
---

# Authorization must bind to the target record's existing ownership

For any UPDATE/DELETE on a scoped resource, authorization must be proven against the
**target row's existing owner/school**, and the mutation predicate must include that
scope — never trust foreign keys or scope fields from the request body.

**Why:** A PUT that checks `ownsProsem(body.prosemId)` but updates
`where(id = params.id)` is an IDOR: an attacker passes their own `prosemId` in the
body and someone else's `id` in the path, reassigning/overwriting another teacher's
row. Same class of bug bit academic-week update/delete (updated/deleted by `id` only
with no school-bound predicate). Found and fixed during Info Pekanan build.

**How to apply:**
- Fetch the existing row by id first, verify its *current* owner/school matches the
  caller, THEN mutate. Or put the owner/school directly in the WHERE clause.
- If the body also carries a new FK (e.g. moving an item to a different prosem/calendar),
  verify the caller owns the *new* target too.
- No-school edge case: a guru with empty `school` must get empty/404, NOT a
  cross-school fallback. Avoid `guru.school ? eq(school, guru.school) : undefined` —
  when school is empty that degrades to "match any school". Gate with
  `if (!guru.school) return empty/404` first.
- Helpers `calendarInSchool`/`weekInSchool` in `academic-calendars.ts` and
  `ownsProsem` in `prosem.ts` are the reference pattern.

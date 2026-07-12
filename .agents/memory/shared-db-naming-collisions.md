---
name: Shared DB naming collisions
description: NEON_DATABASE_URL/DATABASE_URL is a Postgres instance shared across multiple unrelated apps; generic table/constraint/index names in the public schema collide across apps.
---

Postgres constraint and index names are unique **per schema**, not per table. On a shared
Postgres instance (one `public` schema used by multiple unrelated apps), a generic name
like `session` / `session_pkey` used by connect-pg-simple's default table bootstrap SQL
can collide with another app's table that happens to use the same literal constraint name,
even though the table names differ.

Symptom: `CREATE TABLE IF NOT EXISTS "session" (...)` fails with
`relation "session_pkey" already exists` (42P07) — even on a fresh app — because the "session"
table doesn't exist yet, but the constraint/index name `session_pkey` is already taken by a
different app's table (e.g. `tomat_sessions`) in the same schema. The app throws on startup
and crash-loops in production; each restart hits the same conflict since IF NOT EXISTS only
guards the table name, not the inline constraint/index names.

**Why:** IF NOT EXISTS on CREATE TABLE only prevents an error when the *table* already exists;
it does nothing to prevent a naming collision with an unrelated object of the same name
elsewhere in the schema.

**How to apply:** Any raw-SQL bootstrap (session tables, ad-hoc migrations, etc.) run against a
DB shared with other apps must namespace every identifier — table name, constraint name, index
name — with an app-specific prefix (e.g. `guru_eob5_session`, `guru_eob5_session_pkey`). Never
reuse a library's literal example/default names verbatim on a shared database. To diagnose this
class of error, check both `information_schema.tables` (does the table exist?) and
`pg_class`/`pg_namespace` (does an object with that name exist anywhere in the schema, and what
table does it actually belong to?) — don't assume the conflicting object belongs to your own table.

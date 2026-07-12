---
name: Schema drift on shared production DB
description: Drizzle schema in code can drift ahead of the actual shared Neon DB table, causing 500s on routes that select/insert newer columns.
---

The `gurus` table (shared Neon Postgres, see shared-neon-accounts.md) was missing
columns that the Drizzle schema (`lib/db/src/neon/gurus.ts`) declared: `jabatan`,
`mapel`, `wakasek_bidang`, `wali_kelas_kelas`, `school`. Routes that selected or
inserted these columns (e.g. `/auth/register`) failed with a generic Postgres
"Failed query" error (column does not exist), surfaced to the user as a vague
500/"Terjadi kesalahan server" with no useful detail in the app logs.

**Why:** feature code was written/merged against the intended schema, but the
migration was never applied to this particular shared DB instance. Drizzle
does not validate the live DB schema against the code schema at startup, so
the mismatch only surfaces at request time on the affected columns.

**How to apply:** when a route hits a mysterious 500 with a DB stack trace
that just says "Failed query" (message truncated in logs), reproduce locally
against the same DB (`psql "$NEON_DATABASE_URL" -c "\d <table>"`) and diff
columns against the Drizzle schema file before assuming it's an app/deploy
bug. On a DB shared with other apps, prefer manual, additive
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` over `drizzle-kit push`/`push-force`
for fixes — push compares the whole table to the schema file and may offer to
drop columns (e.g. `email`, `whatsapp`) that other apps still use but aren't
declared in this app's schema.

Sometimes the mismatch isn't missing columns but a full table-name collision:
a table this app's schema declares (e.g. `students`) may already exist in the
shared DB owned by a totally different, incompatible app (different PK type,
different columns entirely). `\d <table>` reveals this immediately (columns
don't remotely resemble the Drizzle schema). Fix by renaming the app's table
in the schema file to a namespaced name (e.g. `guru_eob5_students`), matching
the same pattern already used for the session table, then creating the new
table fresh with plain `CREATE TABLE IF NOT EXISTS` (not push, for the same
reason as above). This is a code change (schema file edit), not just a DB
fix, so it requires a redeploy — unlike a pure `ALTER TABLE ADD COLUMN` fix.

This Replit workspace's own dev `DATABASE_URL` can independently drift from a
rename applied elsewhere (e.g. only to a separately-managed production DB):
found the schema file already renamed `students` → `guru_eob5_students` in
code, but the dev DB still had the old `students` table, so any query on that
table 500'd in dev even though the rename "was already done." Always verify
the *current* DATABASE_URL's actual table names (`information_schema.tables`)
against the schema file before trusting that a documented past fix is live
everywhere; apply the same rename/`ALTER` there too if it's missing.

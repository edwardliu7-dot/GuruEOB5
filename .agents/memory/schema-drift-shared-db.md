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

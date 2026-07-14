---
name: GuruEOB5 has two databases, not one
description: DATABASE_URL is a dedicated per-app Postgres (most tables); NEON_DATABASE_URL is the shared cross-app Neon DB (gurus table only). Also covers a drizzle-kit push gotcha.
---

`db`/`DATABASE_URL` (Replit-managed Postgres, host `helium`) is this app's own dedicated dev database — it holds subjects, documents, grades, journal, attendance, points, academic calendars, prosem, and any new app-specific tables. `neonDb`/`NEON_DATABASE_URL` is the separate shared Neon DB that only holds the cross-app `gurus` accounts table (see shared-neon-accounts.md).

**Why it matters:** earlier memory entries about "shared DB" collision/leak risk apply only to the `gurus` table via `NEON_DATABASE_URL`. New app-specific tables added via `lib/db/src/schema/*.ts` go through `DATABASE_URL` and are safe from cross-app collisions — no need for defensive naming there (though descriptive names are still good practice).

**How to apply:** when adding new tables for this app, migrate/push against `DATABASE_URL`, not `NEON_DATABASE_URL`. If you need to know which DB a table lives in, check whether its schema file imports from `./schema/*` (dedicated `db`) or `./neon/gurus` (shared `neonDb`).

## drizzle-kit push interactive prompt gotcha

`pnpm run push` in `lib/db` (`drizzle-kit push`) can fail non-interactively with "Interactive prompts require a TTY terminal" even for brand-new, unambiguous tables — drizzle-kit's rename-detection heuristic tries to prompt and there's no TTY in this environment.

**Why it matters:** this blocks a normal `drizzle-kit push` workflow for any schema change here, not just risky ones.

**How to apply:** for brand-new tables (no ambiguity possible), skip `drizzle-kit push` and create them directly with `psql "$DATABASE_URL"` DDL that matches the Drizzle schema exactly (column names via `snake_case`, types, defaults, FKs). Verify with `\d tablename` after. Reserve this manual-DDL approach for genuinely new tables; for altering/renaming existing tables, resolving the interactive prompt properly still matters.

For syncing many/all tables at once (e.g. a dev DB that's missing most of the schema entirely, seen once when only `guru_eob5_session` existed), prefer `drizzle-kit generate --config ./drizzle.config.ts` (non-interactive, writes a plain SQL file under `drizzle/`) then apply it directly with `psql "$DATABASE_URL" -f drizzle/<file>.sql`; delete the generated `drizzle/` folder afterward since this project's convention is push-based, not migration-file-based. Always run `\dt` first to check which tables actually exist — a route 500ing on a basic insert/select for a table that logically must exist is a strong signal of this drift, not an app bug.

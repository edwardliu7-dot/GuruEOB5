---
name: Production session cookies behind Replit proxy
description: Why login "succeeds" but /me returns 401 in production, and how sessions must be configured
---

# Production session cookies behind Replit proxy

Symptom: in production, login returns 200 but every subsequent authenticated request returns 401 — the session cookie is never persisted.

**Rules:**
- Express behind Replit's HTTPS proxy must set `app.set("trust proxy", 1)`, or `express-session` with `cookie.secure: true` silently refuses to set the cookie (it thinks the connection is plain HTTP).
- Do not use MemoryStore in production — sessions vanish on restart and break across autoscale instances. Use a Postgres-backed store (connect-pg-simple on `DATABASE_URL`).
- connect-pg-simple's `createTableIfMissing: true` reads `table.sql` from its package dir at runtime — this breaks when the server is bundled with esbuild (ENOENT `dist/table.sql`), and sessions silently fail to save. Create the `session` table yourself at startup with `CREATE TABLE IF NOT EXISTS`.
- Gate `app.listen` on the session-table bootstrap completing; fail fast (exit 1) if it can't be created.

**Why:** Production login was broken with exactly this symptom; dev worked because `secure` was false there. The esbuild/table.sql failure was only visible as a startup stderr line, not as request errors.

**How to apply:** Any time an Express artifact with session auth is bundled and deployed, verify the trust-proxy setting, the persistent store, and that a `me`-style request works with a fresh cookie after a server restart.

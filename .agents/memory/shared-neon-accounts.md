---
name: Shared Neon accounts DB
description: Rules for working with the cross-app shared gurus table on Neon (accounts) vs local Replit Postgres (app data)
---

# Shared Neon accounts DB

Accounts (`gurus` table) live in an external Neon DB shared with two other apps (TOMAT, BLP). App data lives in local Replit Postgres with `teacherId` as plain text — no FK across databases.

**Rules:**
- Passwords are PLAINTEXT by the user's explicit choice, for cross-app login compatibility. Do not hash them without asking — the other apps compare plaintext. Mitigate by always stripping `password` from API responses.
- Any read of the shared table (lists, counts, aggregates) MUST be tenant-scoped by the current guru's `school`, or accounts from unrelated apps/schools leak into responses. A guru with `school = null` should only see themselves.
- Mutations too: admin-privileged update/delete on `gurus` must also be school-scoped (except self-mutation), otherwise the global admin can alter accounts belonging to the other apps' schools (IDOR found in review).
- Local app data reads that feed multi-teacher views (dashboards, role overviews) must also filter by `school`, since the local DB can hold data for multiple schools.
- Test accounts created during e2e runs are written to the real shared DB — always delete them at the end of the test.
- Profile fields on `gurus` (`bio`, `photo_url`) are shared across all three apps. Photos are stored as client-resized (≤256px) JPEG **data URLs** directly in `photo_url` — chosen over object storage so BLP/TOMAT render them with zero cross-app infra. Server validates `photoUrl` length + scheme; clearing normalizes `""` → `null`. Keep any new shared profile field cross-app safe (no app-local hosting).

**Why:** Post-build architect review found authenticated users could enumerate real teachers from the other apps via `/teachers` and role overviews; runtime responses contained real foreign usernames.

**How to apply:** Whenever adding an endpoint that touches `gurus` or aggregates per-teacher/per-student data, apply the shared school-scoping helper instead of unfiltered `select()`.

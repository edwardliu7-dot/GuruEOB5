# GuruEOB5

An Indonesian school/teacher administration app: teachers log in, see a dashboard of key stats, manage subject-based administration documents, keep a teaching journal, track attendance/grades/points, and manage a student roster.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only, Replit Postgres app data only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`, `NEON_DATABASE_URL`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, session-based auth (`express-session` + `bcryptjs`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite (`artifacts/guru-eob5`), blue/gold/cream Indonesian-school theme

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth for all endpoints/schemas)
- `lib/db/src/schema/` — Drizzle schema for local app data: students, subjects, documents, journal, attendance, grades, points
- `lib/db/src/neon/` — Drizzle schema + client for the shared Neon `gurus` table (accounts)
- `artifacts/api-server/src/routes/` — one route file per resource
- `artifacts/guru-eob5/src/pages/` — one page per feature (login, dashboard, administrasi, siswa, jurnal, absensi, nilai, poin, guru)

## Architecture decisions

- Custom username/password login (not Clerk/Replit Auth) — reference screenshots specified a custom branded login screen.
- Session-based auth via `express-session`, teacher id stored in `req.session.teacherId` (= Neon `gurus.id` slug).
- Accounts live in a SHARED external Neon DB (`gurus` table, via `NEON_DATABASE_URL`) shared with the TOMAT and BLP apps; all other app data stays in local Replit Postgres (`teacherId` stored as plain text, no FK to Neon).
- Passwords stored in PLAINTEXT in `gurus` — the user's explicit choice for cross-app login compatibility. Never "fix" this to bcrypt without asking; password is stripped from all API responses (`guruToTeacher`).
- Tenant scoping: all reads against shared/global data must be filtered by the current guru's `school` (`sameSchoolFilter` in `api-server/src/lib/auth.ts`); gurus with no school only see themselves. Admin mutations on teachers are also school-scoped (except self).
- Admin role: `ADMIN_USERNAMES = ["edwardliu7"]` in `api-server/src/lib/auth.ts`; `Teacher.isAdmin` in API responses. Data Siswa and Data Guru are admin-only (nav hidden + `ProtectedRoute adminOnly` + backend `requireAdmin` on GET /teachers and all student writes). GET /students stays auth-only for absensi/nilai/poin.
- AI student import: any spreadsheet (xlsx/xls/csv/ods…) parsed client-side with SheetJS, raw rows sent to `POST /students/import/analyze` where Gemini (`gemini-2.5-flash`, `GEMINI_API_KEY`, structured JSON output in `api-server/src/lib/gemini.ts`) maps columns to student fields; user verifies/edits in a dialog, then `POST /students/bulk` saves (max 1000 rows).

## Product

- Login (username/password) + multi-step registration (nama+gelar → jabatan checklist with conditional mapel/wakasek/wali-kelas fields → kelas diampu + sekolah → username/password)
- Role-based menus by jabatan: kepala_sekolah (/kepsek Progres Guru; can also open kurikulum & kesiswaan), wakasek kurikulum (/kurikulum), wakasek kesiswaan (/kesiswaan), wali_kelas (/walikelas)
- Teacher dashboard: student/teacher counts, admin doc completion donut, journal progress chart
- Administrasi Guru: subject folders containing admin documents
- Data Siswa (admin-only): student table with search, add/edit/delete, AI-assisted spreadsheet import with verification dialog
- Data Guru (admin-only): teacher directory
- Jurnal Mengajar: per-subject teaching journal entries
- Absensi, Nilai, Poin: attendance, grades, and points tracking

## User preferences

_None recorded yet._

## Gotchas

- Any `type: string` timestamp field in `openapi.yaml` must also have `format: date-time`, or Orval won't coerce Drizzle `Date` objects and response validation will throw. See `.agents/memory/openapi-date-fields.md`.
- Express route paths must match the OpenAPI spec's path keys exactly — a mismatch typechecks fine but causes runtime 404s. See `.agents/memory/route-path-drift.md`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

# GuruEOB5

An Indonesian school/teacher administration app: teachers log in, see a dashboard of key stats, manage subject-based administration documents, keep a teaching journal, track attendance/grades/points, and manage a student roster.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, session-based auth (`express-session` + `bcryptjs`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite (`artifacts/guru-eob5`), blue/gold/cream Indonesian-school theme

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth for all endpoints/schemas)
- `lib/db/src/schema/` — Drizzle schema: teachers, students, subjects, documents, journal, attendance, grades, points
- `artifacts/api-server/src/routes/` — one route file per resource
- `artifacts/guru-eob5/src/pages/` — one page per feature (login, dashboard, administrasi, siswa, jurnal, absensi, nilai, poin, guru)

## Architecture decisions

- Custom username/password login (not Clerk/Replit Auth) — reference screenshots specified a custom branded login screen.
- Session-based auth via `express-session`, teacher id stored in `req.session.teacherId`.

## Product

- Login (username/password)
- Teacher dashboard: student/teacher counts, admin doc completion donut, journal progress chart
- Administrasi Guru: subject folders containing admin documents
- Data Siswa: student table with search, add/edit/delete
- Jurnal Mengajar: per-subject teaching journal entries
- Absensi, Nilai, Poin: attendance, grades, and points tracking

## User preferences

_None recorded yet._

## Gotchas

- Any `type: string` timestamp field in `openapi.yaml` must also have `format: date-time`, or Orval won't coerce Drizzle `Date` objects and response validation will throw. See `.agents/memory/openapi-date-fields.md`.
- Express route paths must match the OpenAPI spec's path keys exactly — a mismatch typechecks fine but causes runtime 404s. See `.agents/memory/route-path-drift.md`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

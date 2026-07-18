# GuruEOB5

An Indonesian school administration platform for teachers. Manages students, attendance, grades, teaching journals, lesson plans, and AI-generated teaching materials (modul ajar, soal otomatis).

## Stack

- **Frontend** (`artifacts/guru-eob5`): React + Vite + Tailwind CSS + shadcn/ui
- **Backend** (`artifacts/api-server`): Express 5 + Drizzle ORM + PostgreSQL
- **AI**: Google Gemini (student import, modul ajar generation, soal otomatis, TP import)
- **Auth**: Session-based (express-session + connect-pg-simple)
- **Package manager**: pnpm (monorepo)

## Running the app

Two workflows start automatically:

| Workflow | Command |
|---|---|
| `artifacts/api-server: API Server` | `pnpm --filter @workspace/api-server run dev` |
| `artifacts/guru-eob5: web` | `pnpm --filter @workspace/guru-eob5 run dev` |

The frontend is served at `/` and the API at `/api`.

## Environment secrets required

| Secret | Purpose |
|---|---|
| `SESSION_SECRET` | Express session signing |
| `GEMINI_API_KEY` | Google Gemini AI features |
| `NEON_DATABASE_URL` | Shared Neon Postgres (gurus/accounts table) |
| `DATABASE_URL` | App database — provisioned automatically by Replit |

## Key directories

- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/gemini.ts` — Gemini AI helpers
- `artifacts/guru-eob5/src/` — React frontend
- `lib/db/src/schema/` — Drizzle schema (push with `pnpm --filter @workspace/db run push`)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (regenerate with `pnpm --filter @workspace/api-spec run codegen`)

## User preferences

- Keep existing project structure and stack

---
name: Object storage setup gotchas
description: Non-obvious pitfalls when adding Replit Object Storage + Uppy-based upload client to an existing pnpm monorepo app.
---

- **Adding columns to a table on a DB that also hosts `connect-pg-simple` session tables**: `drizzle-kit push` diffs the *entire* database, not just tables in your schema. If `session`/`<app>_session` tables exist (from express-session) but aren't declared in the Drizzle schema, push proposes dropping them — and the interactive confirmation prompt has no TTY in this environment, so it can't be confirmed safely, and `push-force` would blindly apply the drop. For simple additive column changes, prefer hand-written `ALTER TABLE ... ADD COLUMN` DDL via the DB tool's `executeSql`, skipping drizzle-kit entirely.

- **pnpm `overrides` with no direct root dependency**: the `overrides.react: "$react"` catalog-alias syntax only works if the root `package.json` already has a matching key to alias from. If root has no direct `react` dependency, use the literal pinned version string instead (e.g. `"react": "19.1.0"`), not the `$name` alias.

- **New workspace package + TS project references**: a new `lib/*` package needs `composite: true` (plus `declarationMap`, `emitDeclarationOnly`) in its own `tsconfig.json` for other packages to reference it via TS project references, matching the pattern used by existing `lib/*` packages. Forgetting this produces `TS6306: Referenced project must have setting "composite": true`. Also run `pnpm install` after adding a new package with new deps (e.g. Uppy) — a `tsc -b` build of the new package will otherwise fail with `Cannot find module 'react'` etc. until the workspace symlinks exist.

- **Uppy v5 Dashboard component**: `@uppy/react`'s `/dashboard-modal` subpath export pulls in `@uppy/core`, `@uppy/dashboard` CSS, etc., and can fail to resolve under Vite even though the package.json exports map looks correct. If the app only needs the lightweight presigned-URL upload flow (a plain `useUpload` hook doing `fetch`+`PUT`), don't export the Dashboard-based `ObjectUploader` component from the shared package at all — it drags in fragile transitive resolution for a component nobody imports.

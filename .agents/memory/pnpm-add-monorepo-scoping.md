---
name: pnpm add must be scoped to the target package directory
description: Adding a new dependency to one artifact/package in this pnpm monorepo can fail from the root; run pnpm add from inside artifacts/<app> instead.
---

Running the package-management tool's install (which effectively does `pnpm add <pkg>`) scoped to the workspace root can fail with `ERR_PNPM_ADDING_TO_ROOT` even when the intent is to add a dependency to one specific artifact/package.

**Why it matters:** this looks like a generic install failure and can waste a retry loop before realizing it's a scoping issue, not a package or network problem.

**How to apply:** `cd` into the target package directory (e.g. `artifacts/api-server` or `artifacts/guru-eob5`) and run `pnpm add <pkg>` directly there. This adds the dependency to that package's own `package.json` as expected in the monorepo.

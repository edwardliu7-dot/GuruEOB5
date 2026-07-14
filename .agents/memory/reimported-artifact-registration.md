---
name: Re-imported project artifact registration gap
description: A GitHub-imported PNPM_WORKSPACE project can have valid artifacts/*/.replit-artifact/artifact.toml files on disk that the platform doesn't know about yet -- listArtifacts()/listWorkflows() return empty and the shared dev-domain proxy 502s even though a manually configured plain workflow serves the same port fine on localhost.
---

## Symptom

- `listArtifacts()` and `listWorkflows()` return empty despite `artifact.toml` files existing for every service.
- `createArtifact()` with an existing slug fails with `ARTIFACT_DIR_EXISTS`.
- `WorkflowsRestart` on the expected managed name (`artifacts/<slug>: <service>`) fails with "doesn't exist in config".
- A manually `configureWorkflow`'d process serves `curl localhost:<port>` fine, but the external `$REPLIT_DEV_DOMAIN` returns 502 / blank screenshot -- because this stack type routes everything through the artifact-router, which has no route table until artifacts are registered.

## Fix

Call `createArtifact()` for **any** brand-new throwaway slug (e.g. a fresh `react-vite` artifact). This triggers the platform to retroactively discover and register every other `artifact.toml`-declared service already on disk -- `listArtifacts()` then lists them all, and their real managed workflows (`artifacts/<slug>: <service-name>`) appear and become startable via `WorkflowsRestart`. Delete the throwaway artifact afterward (remove its workflow + `rm -rf` its directory; there is no `deleteArtifact()` callback so the registry entry is cleaned up by the platform automatically once the directory is gone).

**Why:** the artifact-router (env var `REPLIT_ARTIFACT_ROUTER`) that backs the shared dev-domain proxy for this stack type only routes to artifacts in the platform's registry, not to whatever `artifact.toml` files happen to exist on disk. On fresh import that registry can be stale/empty even though the files are correct.

**How to apply:** if you inherit a re-imported project where preview 502s despite workflows running on the right port, don't reach for more manual `configureWorkflow` shims -- create one disposable artifact first to force re-registration, then use the now-real managed workflow names.

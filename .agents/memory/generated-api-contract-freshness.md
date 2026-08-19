---
name: Generated API contract freshness
description: Runtime behavior depends on generated API package output, not only the OpenAPI source and route code.
---

After changing an OpenAPI request or response shape, run the API spec codegen before testing the feature. The API server and frontend may resolve generated package output, so stale generated schemas can reject a valid-looking request at runtime.

**Why:** A bulk attendance request was rejected because the generated client/schema still required a removed field even though the source OpenAPI and route had already been updated.

**How to apply:** Treat `pnpm --filter @workspace/api-spec run codegen` as part of every OpenAPI contract change, then restart the affected workflows and inspect the generated input type.
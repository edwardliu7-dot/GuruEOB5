---
name: DB-only file storage (no object storage)
description: Pattern used when a project explicitly wants no Replit Object Storage / external storage dependency — all files live as base64 in Postgres.
---

Some projects (per explicit user instruction) must not depend on Replit Object Storage or any storage service besides the project's own Postgres (Neon) database. In that case, store uploaded file bytes directly as a `text` column (base64-encoded) on the owning row, not as a path/reference to an external object store.

**Why:** the user wants a single source of truth (Neon Postgres) for all persisted data, no external storage service in the dependency graph.

**How to apply:**
- Client reads the file via `FileReader.readAsDataURL`, strips the `data:...;base64,` prefix, and sends the raw base64 string as a normal JSON field in the create request (no presigned-URL/multipart dance needed).
- Server decodes with `Buffer.from(str, "base64")` and stores the base64 string as-is in a `text` column; on download, decode and send the buffer directly with the right `Content-Type`/`Content-Disposition` — no external service call.
- Never `SELECT *` a table with a file-blob column for list endpoints — explicitly project the metadata columns (name, size, type, timestamps) and exclude the blob column, or list responses balloon in size.
- Raise the JSON body size limit (e.g. `express.json({ limit: "15mb" })`) to accommodate base64 overhead (~33% larger than the raw file) for realistic document sizes; this is the practical ceiling for this approach — very large files (tens of MB+) are a poor fit for this pattern and should get a real object store instead.

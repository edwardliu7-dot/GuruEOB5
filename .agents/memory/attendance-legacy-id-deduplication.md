---
name: Attendance legacy ID deduplication
description: Constraint for bulk attendance writes when roster accounts map to legacy TOMAT student IDs
---

Bulk attendance writes must collapse entries by the legacy TOMAT `student_id` before inserting with an upsert on `(student_id, tanggal)`.

**Why:** More than one current roster record can potentially point at the same legacy account. PostgreSQL rejects a single `INSERT ... ON CONFLICT DO UPDATE` when the same target row appears twice in the input batch.

**How to apply:** Deduplicate mapped legacy IDs in every attendance bulk path, not only the frontend's roster IDs, because frontend IDs can be unique while their legacy mappings are not.
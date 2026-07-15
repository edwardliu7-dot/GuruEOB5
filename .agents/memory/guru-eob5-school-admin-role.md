---
name: GuruEOB5 school-admin vs platform-admin
description: Why "kepala_sekolah" role must be treated as a school-scoped admin, separate from the hardcoded platform-owner admin check.
---

`isAdminGuru` in `artifacts/api-server/src/lib/auth.ts` checks a hardcoded single username (the platform owner). It originally gated ALL "admin" actions: managing students (add/edit/delete), teachers roster, teaching materials (bahan ajar), academic calendar, AND the global feedback inbox.

This meant no school's `kepala_sekolah` (principal) could ever add/manage their own school's students — only the one hardcoded account could, anywhere. This was the root cause of a report that a wali kelas (homeroom teacher) saw no students in the "Akun Siswa" (generate student accounts) feature: the class roster was simply never populated, because no one at that school had a way to add students.

**Why:** `JABATAN_OPTIONS` (`kepala_sekolah`, `wakasek`, `guru`, `wali_kelas`) implies per-school roles, but the "admin" gate was global/platform-level, not school-scoped — a mismatch between the role model and the authorization check.

**How to apply:** Use `isSchoolAdmin`/`requireSchoolAdmin` (platform admin OR the guru's own `kepala_sekolah` role) for anything school-scoped: students CRUD, teachers roster, bahan ajar, academic calendar. Keep `isAdminGuru`/`requireAdmin` (hardcoded platform owner only) for truly global/cross-school concerns like the feedback/support inbox — do not conflate the two.

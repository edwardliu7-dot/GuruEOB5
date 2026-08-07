-- Migration: attendance_records v2
-- Removes subject_id (attendance is now per-day per-student, not per-subject),
-- adds filled_by_teacher_id + filled_by_teacher_name,
-- and replaces the old unique index with (student_id, tanggal).
--
-- Run on production VPS via psql:
--   psql $DATABASE_URL -f migrations/production-vps/migrate_attendance_records_v2.sql

BEGIN;

-- 1. Drop old unique index (includes subject_id which no longer exists in schema)
DROP INDEX IF EXISTS attendance_student_subject_tanggal_unique;

-- 2. Add new columns (idempotent)
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS filled_by_teacher_id   text,
  ADD COLUMN IF NOT EXISTS filled_by_teacher_name text;

-- 3. Make subject_id nullable (can't drop immediately if data exists — make nullable first)
ALTER TABLE attendance_records
  ALTER COLUMN subject_id DROP NOT NULL;

-- 4. Create new unique index on (student_id, tanggal) only
CREATE UNIQUE INDEX IF NOT EXISTS attendance_student_tanggal_unique
  ON attendance_records (student_id, tanggal);

COMMIT;

-- NOTE: After verifying everything works, you can optionally remove the subject_id
-- column entirely with:
--   ALTER TABLE attendance_records DROP COLUMN IF EXISTS subject_id;

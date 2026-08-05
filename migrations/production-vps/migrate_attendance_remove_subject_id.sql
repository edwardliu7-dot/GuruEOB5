-- Migration: Remove subject_id from attendance_records and add filled_by columns
-- Context: attendance is now per-day per-student (not per-subject),
--          and we track which teacher filled the record.
--
-- Run this once on the VPS production database.

BEGIN;

-- 1. Add new columns (nullable so it works even if old records exist)
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS filled_by_teacher_id   text,
  ADD COLUMN IF NOT EXISTS filled_by_teacher_name text;

-- 2. Drop the old unique index that includes subject_id
DROP INDEX IF EXISTS attendance_student_subject_tanggal_unique;

-- 3. Before creating the new unique index on (student_id, tanggal),
--    remove duplicate rows keeping only the most recent one per student+tanggal.
DELETE FROM attendance_records
WHERE id NOT IN (
  SELECT DISTINCT ON (student_id, tanggal) id
  FROM attendance_records
  ORDER BY student_id, tanggal, created_at DESC
);

-- 4. Create new unique index on (student_id, tanggal) only
CREATE UNIQUE INDEX IF NOT EXISTS attendance_student_tanggal_unique
  ON attendance_records (student_id, tanggal);

-- 5. Make subject_id nullable so existing rows don't break,
--    then drop the column entirely.
ALTER TABLE attendance_records
  ALTER COLUMN subject_id DROP NOT NULL;

ALTER TABLE attendance_records
  DROP COLUMN IF EXISTS subject_id;

COMMIT;

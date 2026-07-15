-- Bahan Ajar table: school-scoped teaching materials.
-- Run on the VPS Postgres (application database, not Neon).
-- Safe to run multiple times (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS bahan_ajar (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school         TEXT NOT NULL,
  judul          TEXT NOT NULL,
  mata_pelajaran TEXT,
  kelas          TEXT,
  deskripsi      TEXT,
  file_name      TEXT,
  file_type      TEXT,
  file_size      INTEGER,
  file_data      TEXT,
  link_url       TEXT,
  created_by      TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

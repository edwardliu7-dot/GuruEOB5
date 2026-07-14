-- Migration: Buat tabel feedback di production VPS Postgres
-- Jalankan file ini di database Postgres VPS Coolify Anda untuk
-- mengaktifkan fitur "Saran & Laporan" (feedback widget).
--
-- Cara menjalankan (dari VPS atau Coolify terminal):
--   psql "$DATABASE_URL" -f create_feedback.sql

CREATE TABLE IF NOT EXISTS "feedback" (
  "id"           uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "teacher_id"   text        NOT NULL,
  "teacher_name" text        NOT NULL,
  "kategori"     text        NOT NULL CHECK (kategori IN ('saran', 'kritik', 'bug')),
  "pesan"        text        NOT NULL,
  "is_read"      boolean     NOT NULL DEFAULT false,
  "created_at"   timestamptz NOT NULL DEFAULT now()
);

-- Migration: Buat tabel student_accounts di production VPS Postgres
-- Jalankan file ini di database Postgres VPS Coolify Anda jika halaman
-- "Akun Siswa" menampilkan error "Gagal mengambil status akun siswa".
--
-- Cara menjalankan (dari VPS atau Coolify terminal):
--   psql "$DATABASE_URL" -f create_student_accounts.sql

CREATE TABLE IF NOT EXISTS "student_accounts" (
  "id"              uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id"      uuid        NOT NULL
                      REFERENCES "guru_eob5_students"("id") ON DELETE CASCADE,
  "tomat_student_id" text       NOT NULL,
  "username"        text        NOT NULL,
  "password"        text        NOT NULL,
  "created_at"      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "student_accounts_student_id_unique"
  ON "student_accounts" ("student_id");

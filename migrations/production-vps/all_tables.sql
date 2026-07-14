-- =============================================================
-- GuruEOB5 – Full Production Schema Migration
-- Aman dijalankan berkali-kali (semua pakai IF NOT EXISTS).
-- Urutan sudah benar sesuai dependensi FK.
-- =============================================================

-- 1. subjects (tidak ada FK ke tabel lain)
CREATE TABLE IF NOT EXISTS subjects (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  teacher_id  text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS subjects_teacher_name_unique
  ON subjects (teacher_id, name);

-- 2. guru_eob5_students (tidak ada FK ke tabel lain)
CREATE TABLE IF NOT EXISTS guru_eob5_students (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nisn          text,
  nama_lengkap  text        NOT NULL,
  kelas         text        NOT NULL,
  jenis_kelamin text        NOT NULL CHECK (jenis_kelamin IN ('L','P')),
  school        text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS guru_eob5_students_school_nisn_unique
  ON guru_eob5_students (school, nisn)
  WHERE nisn IS NOT NULL AND nisn <> '';

-- 3. academic_calendars (tidak ada FK ke tabel lain)
CREATE TABLE IF NOT EXISTS academic_calendars (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  school       text        NOT NULL,
  created_by   text        NOT NULL,
  tahun_ajaran text        NOT NULL,
  semester     text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 4. academic_weeks (FK → academic_calendars)
CREATE TABLE IF NOT EXISTS academic_weeks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id     uuid        NOT NULL REFERENCES academic_calendars(id) ON DELETE CASCADE,
  pekan_ke        integer     NOT NULL,
  tanggal_mulai   date        NOT NULL,
  tanggal_selesai date        NOT NULL,
  jenis           text        NOT NULL,
  keterangan      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 5. documents (FK → subjects)
CREATE TABLE IF NOT EXISTS documents (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  uuid        NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  file_data   text        NOT NULL,
  file_name   text        NOT NULL,
  file_type   text,
  file_size   integer,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- 6. grades (FK → guru_eob5_students, subjects, academic_calendars)
CREATE TABLE IF NOT EXISTS grades (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     uuid         NOT NULL REFERENCES guru_eob5_students(id) ON DELETE CASCADE,
  subject_id     uuid         NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  calendar_id    uuid         NOT NULL REFERENCES academic_calendars(id) ON DELETE CASCADE,
  jenis          text         NOT NULL,
  lingkup_materi integer,
  tp_number      integer,
  nilai          numeric      NOT NULL,
  created_at     timestamptz  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS grades_formatif_unique
  ON grades (student_id, subject_id, calendar_id, lingkup_materi, tp_number)
  WHERE jenis = 'formatif';
CREATE UNIQUE INDEX IF NOT EXISTS grades_sumatif_lm_unique
  ON grades (student_id, subject_id, calendar_id, lingkup_materi)
  WHERE jenis = 'sumatif_lm';
CREATE UNIQUE INDEX IF NOT EXISTS grades_sumatif_tengah_unique
  ON grades (student_id, subject_id, calendar_id)
  WHERE jenis = 'sumatif_tengah';
CREATE UNIQUE INDEX IF NOT EXISTS grades_sumatif_akhir_unique
  ON grades (student_id, subject_id, calendar_id)
  WHERE jenis = 'sumatif_akhir';

-- 7. attendance_records (FK → guru_eob5_students, subjects)
CREATE TABLE IF NOT EXISTS attendance_records (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid        NOT NULL REFERENCES guru_eob5_students(id) ON DELETE CASCADE,
  subject_id  uuid        NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  tanggal     date        NOT NULL,
  status      text        NOT NULL CHECK (status IN ('hadir','izin','sakit','alpa')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS attendance_student_subject_tanggal_unique
  ON attendance_records (student_id, subject_id, tanggal);

-- 8. point_records (FK → guru_eob5_students)
CREATE TABLE IF NOT EXISTS point_records (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid        NOT NULL REFERENCES guru_eob5_students(id) ON DELETE CASCADE,
  jenis       text        NOT NULL CHECK (jenis IN ('positif','negatif')),
  poin        numeric     NOT NULL,
  keterangan  text        NOT NULL,
  tanggal     date        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 9. prosem (FK → subjects, academic_calendars)
CREATE TABLE IF NOT EXISTS prosem (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  text        NOT NULL,
  subject_id  uuid        NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  calendar_id uuid        NOT NULL REFERENCES academic_calendars(id) ON DELETE CASCADE,
  kelas       text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 10. prosem_items (FK → prosem, academic_weeks)
CREATE TABLE IF NOT EXISTS prosem_items (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  prosem_id  uuid        NOT NULL REFERENCES prosem(id) ON DELETE CASCADE,
  week_id    uuid        NOT NULL REFERENCES academic_weeks(id) ON DELETE CASCADE,
  kd         text,
  materi     text        NOT NULL,
  jp         integer,
  catatan    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 11. journal_entries (FK → subjects, prosem_items)
CREATE TABLE IF NOT EXISTS journal_entries (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id     uuid        NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id     text        NOT NULL,
  tanggal        date        NOT NULL,
  kelas          text        NOT NULL,
  materi         text        NOT NULL,
  catatan        text,
  prosem_item_id uuid        REFERENCES prosem_items(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 12. tujuan_pembelajaran (FK → subjects, academic_calendars)
CREATE TABLE IF NOT EXISTS tujuan_pembelajaran (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id     text        NOT NULL,
  subject_id     uuid        NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  calendar_id    uuid        NOT NULL REFERENCES academic_calendars(id) ON DELETE CASCADE,
  lingkup_materi integer     NOT NULL,
  tp_number      integer     NOT NULL,
  description    text        NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS tujuan_pembelajaran_unique
  ON tujuan_pembelajaran (subject_id, calendar_id, tp_number);

-- 13. student_accounts (FK → guru_eob5_students)
CREATE TABLE IF NOT EXISTS student_accounts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       uuid        NOT NULL REFERENCES guru_eob5_students(id) ON DELETE CASCADE,
  tomat_student_id text        NOT NULL,
  username         text        NOT NULL,
  password         text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS student_accounts_student_id_unique
  ON student_accounts (student_id);

-- 14. ai_modul_ajar (FK → subjects)
CREATE TABLE IF NOT EXISTS ai_modul_ajar (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id     text        NOT NULL,
  subject_id     uuid        NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  materi         text        NOT NULL,
  alokasi_waktu  text        NOT NULL,
  content        jsonb       NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 15. ai_soal_otomatis (FK → subjects)
CREATE TABLE IF NOT EXISTS ai_soal_otomatis (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id         text        NOT NULL,
  subject_id         uuid        NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  materi             text        NOT NULL,
  jumlah_soal        integer     NOT NULL,
  jenis_soal         text        NOT NULL CHECK (jenis_soal IN ('pilihan_ganda','esai')),
  tingkat_kesulitan  text        NOT NULL CHECK (tingkat_kesulitan IN ('mudah','sedang','sulit')),
  content            jsonb       NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- 16. feedback (tidak ada FK ke tabel lain)
CREATE TABLE IF NOT EXISTS feedback (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   text        NOT NULL,
  teacher_name text        NOT NULL,
  kategori     text        NOT NULL CHECK (kategori IN ('saran','kritik','bug')),
  pesan        text        NOT NULL,
  is_read      boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

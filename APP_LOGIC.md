# GuruEOB5 — Dokumentasi Lengkap Logika Aplikasi

> Dokumen ini ditujukan untuk developer aplikasi mobile yang terhubung ke backend GuruEOB5.
> Semua endpoint menggunakan prefix `/api`. Base URL: `https://<domain>/api`.

---

## Daftar Isi

1. [Arsitektur & Stack](#1-arsitektur--stack)
2. [Autentikasi & Sesi](#2-autentikasi--sesi)
3. [Skema Database](#3-skema-database)
4. [API Endpoints Lengkap](#4-api-endpoints-lengkap)
5. [Aturan Multi-Tenancy (School Scoping)](#5-aturan-multi-tenancy-school-scoping)
6. [Tipe Data & Enum](#6-tipe-data--enum)
7. [Error Handling](#7-error-handling)
8. [Alur Fitur Utama](#8-alur-fitur-utama)

---

## 1. Arsitektur & Stack

```
Frontend (React/Vite)  ←→  Backend (Express 5)  ←→  Database (PostgreSQL)
                                    ↕
                            Neon DB (shared)   ← tabel: gurus, pesan_pribadi
                            App DB (dedicated) ← semua tabel lain
```

- **Backend**: Express 5, path prefix `/api`
- **Database utama** (`DATABASE_URL`): PostgreSQL di Replit, menyimpan semua data kecuali akun guru
- **Neon DB** (`NEON_DATABASE_URL`): PostgreSQL shared, hanya untuk tabel `gurus` dan `pesan_pribadi`
- **Session**: `express-session` dengan cookie `connect.sid`
- **AI**: Groq (llama-3.3-70b-versatile, llama-4-scout)

---

## 2. Autentikasi & Sesi

### Mekanisme
- Berbasis **cookie sesi** (`connect.sid`), **bukan JWT/Bearer token**
- Setelah login, server menyimpan `teacherId` di session
- Setiap request terautentikasi harus mengirim cookie sesi

### Login

```
POST /api/auth/login
Content-Type: application/json

Body: { "username": "string", "password": "string" }

Response 200:
{
  "id": "string",           // slug dari username, misal: "budi-santoso"
  "username": "string",
  "name": "string",
  "jabatan": ["guru", "wali_kelas"],   // array string
  "mapel": ["Matematika"],             // array string | null
  "wakasekBidang": null,               // "Kurikulum" | "Kesiswaan" | null
  "waliKelasKelas": "VII Ibnu Battutah" | null,
  "kelasDiampu": ["VII Ibnu Battutah"],
  "school": "string | null",
  "photoUrl": "string | null",
  "bio": "string | null",
  "sebutan": "string | null",
  "createdAt": "ISO8601",
  "isAdmin": false
}

Response 401: { "error": "Username atau password salah" }
```

> ⚠️ **Penting untuk mobile**: Cookie sesi harus disimpan dan dikirim ulang di setiap request. Gunakan `credentials: 'include'` (fetch) atau konfigurasi cookie di HTTP client.

### Register

```
POST /api/auth/register
Body:
{
  "username": "string",
  "password": "string",
  "name": "string",
  "jabatan": ["guru"],                  // wajib, lihat enum
  "mapel": ["Matematika"],              // wajib jika jabatan = guru
  "wakasekBidang": "Kurikulum",         // wajib jika jabatan = wakasek
  "waliKelasKelas": "VII Ibnu Battutah",// wajib jika jabatan = wali_kelas
  "kelasDiampu": ["VII Ibnu Battutah"],
  "school": "string"
}
```

### Logout

```
POST /api/auth/logout
Response: { "success": true }
```

### Cek Sesi / Profil

```
GET /api/auth/me
Header: Cookie: connect.sid=...

Response 200: (sama seperti login)
Response 401: { "error": "Unauthorized" }
```

> Gunakan endpoint ini saat app dibuka untuk mengecek apakah sesi masih aktif.

---

## 3. Skema Database

### Tabel: `gurus` (Neon DB)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | text PK | Slug dari username (misal: `budi-santoso`) |
| `username` | text | Username login |
| `password` | text | Plaintext (by design) |
| `name` | text | Nama lengkap guru |
| `jabatan` | text[] | Array: `kepala_sekolah`, `wakasek`, `guru`, `wali_kelas` |
| `mapel` | text[] | Mata pelajaran yang diampu |
| `kelas_diampu` | text[] | Kelas yang diampu |
| `wakasek_bidang` | text | `Kurikulum` atau `Kesiswaan` |
| `wali_kelas_kelas` | text | Kelas yang menjadi wali kelas |
| `school` | text | Identitas sekolah — kunci multi-tenancy |
| `sebutan` | text | Panggilan custom (misal: "Ustadz") |
| `photo_url` | text | URL foto profil |
| `bio` | text | Biodata singkat |
| `created_at` | timestamptz | |

### Tabel: `guru_eob5_students` (App DB)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | UUID siswa |
| `nisn` | text | Nomor Induk Siswa Nasional (nullable) |
| `nama_lengkap` | text | Nama lengkap |
| `kelas` | text | Kelas (misal: `VII Ibnu Battutah`) |
| `jenis_kelamin` | text | `L` atau `P` |
| `school` | text | Sekolah — kunci multi-tenancy |
| `created_at` | timestamptz | |

> **Unique**: `(school, nisn)` — tapi hanya jika nisn tidak null/kosong

### Tabel: `subjects` (App DB)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | Nama mata pelajaran (misal: `Matematika - VII Ibnu Battutah`) |
| `teacher_id` | text FK→gurus.id | Guru pemilik |
| `deleted_at` | timestamptz | Soft delete — baris dengan nilai ini tidak muncul di list |
| `created_at` | timestamptz | |

> **Auto-sync**: Saat `GET /subjects`, server otomatis membuat folder subjects dari kombinasi `mapel × kelas_diampu` guru jika belum ada.

### Tabel: `attendance_records` (App DB)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `student_id` | uuid FK→guru_eob5_students.id | CASCADE delete |
| `tanggal` | date | Format: `YYYY-MM-DD` |
| `status` | text | `hadir`, `izin`, `sakit`, `alpa` |
| `filled_by_teacher_id` | text | ID guru yang mengisi |
| `filled_by_teacher_name` | text | Nama guru yang mengisi |
| `created_at` | timestamptz | |

> **Unique**: `(student_id, tanggal)` — satu absensi per siswa per hari, upsert jika sudah ada

### Tabel: `grades` (App DB)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `student_id` | uuid FK→guru_eob5_students.id | |
| `subject_id` | uuid FK→subjects.id | |
| `calendar_id` | uuid FK→academic_calendars.id | |
| `jenis` | text | `formatif`, `sumatif_lm`, `sumatif_tengah`, `sumatif_akhir` |
| `lingkup_materi` | integer | 1-5 (null untuk sumatif_akhir/tengah) |
| `tp_number` | integer | 1-4 (hanya untuk formatif) |
| `nilai` | numeric | Nilai angka |
| `created_at` | timestamptz | |

> **Unique per jenis**:
> - `formatif`: `(student_id, subject_id, calendar_id, lingkup_materi, tp_number)`
> - `sumatif_lm`: `(student_id, subject_id, calendar_id, lingkup_materi)`
> - `sumatif_tengah`: `(student_id, subject_id, calendar_id)`
> - `sumatif_akhir`: `(student_id, subject_id, calendar_id)`

### Tabel: `journal_entries` (App DB)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `subject_id` | uuid FK→subjects.id | Mata pelajaran |
| `teacher_id` | text FK→gurus.id | Guru pemilik (tidak ada FK constraint, hanya logika) |
| `tanggal` | date | Format: `YYYY-MM-DD` |
| `kelas` | text | Kelas yang diajar |
| `materi` | text | Materi yang diajarkan |
| `catatan` | text | Catatan tambahan (nullable) |
| `prosem_item_id` | uuid FK→prosem_items.id | Tautan ke rencana prosem (nullable, SET NULL on delete) |
| `created_at` | timestamptz | |

### Tabel: `point_records` (App DB)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `student_id` | uuid FK→guru_eob5_students.id | |
| `jenis` | text | `positif` atau `negatif` |
| `poin` | numeric | Nilai poin |
| `keterangan` | text | Alasan pemberian poin |
| `tanggal` | date | Format: `YYYY-MM-DD` |
| `created_at` | timestamptz | |

### Tabel: `academic_calendars` (App DB)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `school` | text | Sekolah pemilik |
| `created_by` | text | ID guru yang membuat |
| `tahun_ajaran` | text | Misal: `2024/2025` |
| `semester` | text | Misal: `Ganjil`, `Genap` |
| `created_at` | timestamptz | |

### Tabel: `academic_weeks` (App DB)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `calendar_id` | uuid FK→academic_calendars.id | CASCADE delete |
| `pekan_ke` | integer | Urutan pekan (1, 2, 3, ...) |
| `tanggal_mulai` | date | Senin pertama pekan tersebut |
| `tanggal_selesai` | date | |
| `jenis` | text | Misal: `KBM`, `UTS`, `UAS`, `Libur` |
| `keterangan` | text | Keterangan tambahan (nullable) |
| `created_at` | timestamptz | |

### Tabel: `schedules` (App DB)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `teacher_id` | text | ID guru |
| `subject_id` | uuid FK→subjects.id | CASCADE delete |
| `kelas` | text | Kelas |
| `hari` | text | `Senin`, `Selasa`, `Rabu`, `Kamis`, `Jumat`, `Sabtu` |
| `jam_mulai` | text | Format `HH:MM` |
| `jam_selesai` | text | Format `HH:MM` |
| `school` | text | Sekolah |
| `created_at` | timestamptz | |

### Tabel: `prosem` (App DB)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `teacher_id` | text | ID guru |
| `subject_id` | uuid FK→subjects.id | CASCADE delete |
| `calendar_id` | uuid FK→academic_calendars.id | CASCADE delete |
| `kelas` | text | Kelas |
| `created_at` | timestamptz | |

### Tabel: `prosem_items` (App DB)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `prosem_id` | uuid FK→prosem.id | CASCADE delete |
| `week_id` | uuid FK→academic_weeks.id | CASCADE delete |
| `kd` | text | Kompetensi Dasar (nullable) |
| `materi` | text | Topik materi |
| `jp` | integer | Jam pelajaran (nullable) |
| `catatan` | text | Catatan (nullable) |
| `created_at` | timestamptz | |

### Tabel: `tujuan_pembelajaran` (App DB)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `subject_id` | uuid FK→subjects.id | |
| `calendar_id` | uuid FK→academic_calendars.id | |
| `lingkup_materi` | integer | Nomor lingkup materi |
| `tp_number` | integer | Nomor TP dalam lingkup materi |
| `description` | text | Deskripsi tujuan pembelajaran |
| `created_at` | timestamptz | |

> **Unique**: `(subject_id, calendar_id, tp_number)`

### Tabel: `bahan_ajar` (App DB)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `school` | text | Sekolah |
| `judul` | text | Judul bahan ajar |
| `mata_pelajaran` | text | (nullable) |
| `kelas` | text | (nullable) |
| `deskripsi` | text | (nullable) |
| `file_name` | text | Nama file asli |
| `file_type` | text | MIME type |
| `file_size` | integer | Ukuran bytes |
| `file_data` | text | Base64 encoded file (**tidak ikut di GET list**) |
| `link_url` | text | URL eksternal (alternatif file) |
| `created_by` | text | ID guru |
| `created_by_name` | text | Nama guru |
| `created_at` | timestamptz | |

### Tabel: `student_accounts` (App DB)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `student_id` | uuid FK→guru_eob5_students.id | CASCADE delete |
| `tomat_student_id` | text | ID siswa di sistem TOMAT/BLP |
| `username` | text | Username akun siswa |
| `password` | text | Password plaintext |
| `created_at` | timestamptz | |

> **Unique**: `(student_id)` — satu akun per siswa

### Tabel: `pesan_pribadi` (Neon DB — shared dengan TOMAT)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer PK | |
| `sender_id` | text | ID pengirim |
| `sender_role` | text | `guru` atau `siswa` |
| `recipient_id` | text | ID penerima |
| `recipient_role` | text | `guru` atau `siswa` |
| `body` | text | Isi pesan |
| `created_at` | timestamptz | |
| `delivered_at` | timestamptz | |
| `read_at` | timestamptz | Null = belum dibaca |

---

## 4. API Endpoints Lengkap

### Auth

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Daftar akun guru baru |
| POST | `/auth/login` | ❌ | Login, set cookie sesi |
| POST | `/auth/logout` | ❌ | Hapus sesi |
| GET | `/auth/me` | ✅ | Profil guru saat ini |

---

### Guru (Teachers)

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/teachers` | ✅ | Daftar guru se-sekolah |
| PATCH | `/teachers/:id` | ✅ | Update profil guru (diri sendiri atau admin) |
| DELETE | `/teachers/:id` | ✅ | Hapus akun guru (diri sendiri atau admin) |

**GET /teachers** — response array:
```json
[{
  "id": "budi-santoso",
  "username": "budi-santoso",
  "name": "Budi Santoso",
  "jabatan": ["guru", "wali_kelas"],
  "mapel": ["Matematika"],
  "wakasekBidang": null,
  "waliKelasKelas": "VII Ibnu Battutah",
  "kelasDiampu": ["VII Ibnu Battutah"],
  "school": "SMP Al-Falah",
  "photoUrl": null,
  "bio": null,
  "sebutan": null,
  "createdAt": "2024-01-01T00:00:00Z",
  "isAdmin": false
}]
```

**PATCH /teachers/:id** — body (semua opsional):
```json
{
  "name": "string",
  "jabatan": ["guru"],
  "mapel": ["Matematika"],
  "wakasekBidang": null,
  "waliKelasKelas": null,
  "kelasDiampu": ["VII Ibnu Battutah"],
  "school": "string",
  "sebutan": "string",
  "photoUrl": "string",
  "bio": "string"
}
```

---

### Siswa (Students)

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/students` | ✅ | Daftar siswa se-sekolah |
| GET | `/students?kelas=VII+Ibnu+Battutah` | ✅ | Filter per kelas |
| GET | `/students/:id` | ✅ | Detail satu siswa |
| POST | `/students` | ✅ SchoolAdmin | Tambah siswa |
| PATCH | `/students/:id` | ✅ SchoolAdmin | Update data siswa |
| DELETE | `/students/:id` | ✅ SchoolAdmin | Hapus siswa |
| POST | `/students/import/analyze` | ✅ SchoolAdmin | AI parse file spreadsheet → preview |
| POST | `/students/bulk` | ✅ SchoolAdmin | Bulk insert dari hasil analyze |

**GET /students** — response array:
```json
[{
  "id": "uuid",
  "nisn": "1234567890",
  "namaLengkap": "Ahmad Fauzi",
  "kelas": "VII Ibnu Battutah",
  "jenisKelamin": "L",
  "school": "SMP Al-Falah",
  "createdAt": "2024-01-01T00:00:00Z"
}]
```

**POST /students** — body:
```json
{
  "nisn": "1234567890",
  "namaLengkap": "Ahmad Fauzi",
  "kelas": "VII Ibnu Battutah",
  "jenisKelamin": "L"
}
```

> ⚠️ `school` **tidak** dikirim dari client — server mengisi otomatis dari sesi guru.

---

### Mata Pelajaran (Subjects)

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/subjects` | ✅ | Daftar mapel milik guru saat ini |
| POST | `/subjects` | ✅ | Buat mapel baru |
| PATCH | `/subjects/:id` | ✅ | Update nama mapel (hanya pemilik) |
| DELETE | `/subjects/:id` | ✅ | Soft delete mapel |

**GET /subjects** — auto-sync: server membuat entry untuk setiap kombinasi `mapel × kelas_diampu` dari profil guru.

**Response array**:
```json
[{
  "id": "uuid",
  "name": "Matematika - VII Ibnu Battutah",
  "teacherId": "budi-santoso",
  "createdAt": "2024-01-01T00:00:00Z"
}]
```

> `deletedAt` **tidak** ikut di response — subjects dengan `deleted_at` tidak akan muncul.

---

### Absensi (Attendance)

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/attendance` | ✅ | List absensi |
| GET | `/attendance?kelas=VII+Ibnu+Battutah&date=2024-08-01` | ✅ | Filter kelas dan/atau tanggal |
| GET | `/attendance/rekap` | ✅ | Rekap agregat per kelas per tanggal |
| POST | `/attendance` | ✅ | Isi absensi satu siswa |
| POST | `/attendance/bulk` | ✅ | Isi absensi banyak siswa, status sama semua |
| POST | `/attendance/bulk-mixed` | ✅ | Isi absensi satu kelas, status berbeda-beda |
| PATCH | `/attendance/:id` | ✅ | Update status satu record |
| DELETE | `/attendance/:id` | ✅ | Hapus satu record |
| DELETE | `/attendance/bulk-kelas` | ✅ | Hapus semua absensi satu kelas satu tanggal |

**GET /attendance** — response array:
```json
[{
  "id": "uuid",
  "studentId": "uuid",
  "tanggal": "2024-08-01",
  "status": "hadir",
  "filledByTeacherId": "budi-santoso",
  "filledByTeacherName": "Budi Santoso",
  "createdAt": "2024-08-01T07:00:00Z"
}]
```

**POST /attendance/bulk-mixed** — digunakan untuk input absensi seluruh kelas sekaligus:
```json
{
  "tanggal": "2024-08-01",
  "entries": [
    { "studentId": "uuid-1", "status": "hadir" },
    { "studentId": "uuid-2", "status": "sakit" },
    { "studentId": "uuid-3", "status": "alpa" }
  ]
}
```
Response: `{ "count": 3 }`

> ⚠️ Gunakan `upsert` — jika absensi hari itu sudah ada, akan di-update.

**GET /attendance/rekap** — response:
```json
{
  "groups": [{
    "tanggal": "2024-08-01",
    "kelas": "VII Ibnu Battutah",
    "hadir": 25,
    "izin": 1,
    "sakit": 1,
    "alpa": 0,
    "total": 27,
    "filledByTeacherName": "Budi Santoso"
  }]
}
```

---

### Nilai (Grades)

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/grades` | ✅ | List nilai |
| GET | `/grades?studentId=uuid` | ✅ | Filter per siswa |
| GET | `/grades?subjectId=uuid` | ✅ | Filter per mapel |
| GET | `/grades?calendarId=uuid` | ✅ | Filter per semester |
| POST | `/grades` | ✅ | Input nilai baru |
| PATCH | `/grades/:id` | ✅ | Update nilai |
| DELETE | `/grades/:id` | ✅ | Hapus nilai |

**POST /grades** — body:
```json
{
  "studentId": "uuid",
  "subjectId": "uuid",
  "calendarId": "uuid",
  "jenis": "formatif",
  "lingkupMateri": 1,
  "tpNumber": 2,
  "nilai": 85
}
```

> Validasi:
> - `subjectId` harus milik guru yang login
> - `calendarId` harus milik sekolah yang sama
> - `studentId` harus siswa sekolah yang sama

**Response**:
```json
{
  "id": "uuid",
  "studentId": "uuid",
  "subjectId": "uuid",
  "calendarId": "uuid",
  "jenis": "formatif",
  "lingkupMateri": 1,
  "tpNumber": 2,
  "nilai": 85,
  "createdAt": "..."
}
```

---

### Jurnal Mengajar (Journal)

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/journal` | ✅ | Jurnal milik guru yang login |
| GET | `/journal?subjectId=uuid` | ✅ | Filter per mapel |
| POST | `/journal` | ✅ | Catat jurnal baru |
| PATCH | `/journal/:id` | ✅ | Update jurnal |
| DELETE | `/journal/:id` | ✅ | Hapus jurnal |

**POST /journal** — body:
```json
{
  "subjectId": "uuid",
  "tanggal": "2024-08-01",
  "kelas": "VII Ibnu Battutah",
  "materi": "Persamaan Linear Satu Variabel",
  "catatan": "Siswa antusias",
  "prosemItemId": "uuid"   // opsional — tautan ke rencana prosem
}
```

> `prosemItemId` harus milik guru yang sama. Jika tidak, 404.

**Response**:
```json
{
  "id": "uuid",
  "subjectId": "uuid",
  "teacherId": "budi-santoso",
  "tanggal": "2024-08-01",
  "kelas": "VII Ibnu Battutah",
  "materi": "Persamaan Linear Satu Variabel",
  "catatan": "Siswa antusias",
  "prosemItemId": null,
  "createdAt": "..."
}
```

---

### Poin Perilaku (Points)

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/points` | ✅ | List semua poin siswa se-sekolah |
| GET | `/points?studentId=uuid` | ✅ | Filter per siswa |
| POST | `/points` | ✅ | Catat poin satu siswa |
| POST | `/points/bulk` | ✅ | Catat poin banyak siswa, nilai sama |
| POST | `/points/bulk-mixed` | ✅ | Catat poin berbeda per siswa dalam satu tanggal |
| PATCH | `/points/:id` | ✅ | Update catatan poin |
| DELETE | `/points/:id` | ✅ | Hapus catatan poin |

**POST /points** — body:
```json
{
  "studentId": "uuid",
  "jenis": "positif",
  "poin": 10,
  "keterangan": "Membantu teman",
  "tanggal": "2024-08-01"
}
```

---

### Kalender Akademik

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/academic-calendars` | ✅ | Daftar semester sekolah |
| POST | `/academic-calendars` | ✅ SchoolAdmin | Buat semester baru |
| DELETE | `/academic-calendars/:id` | ✅ SchoolAdmin | Hapus semester |
| GET | `/academic-weeks` | ✅ | Daftar pekan |
| GET | `/academic-weeks?calendarId=uuid` | ✅ | Filter per semester |
| POST | `/academic-weeks` | ✅ SchoolAdmin | Buat pekan baru |
| PATCH | `/academic-weeks/:id` | ✅ | Update pekan |
| DELETE | `/academic-weeks/:id` | ✅ SchoolAdmin | Hapus pekan |

**POST /academic-calendars** — body:
```json
{ "tahunAjaran": "2024/2025", "semester": "Ganjil" }
```

**POST /academic-weeks** — body:
```json
{
  "calendarId": "uuid",
  "pekanKe": 1,
  "tanggalMulai": "2024-07-15",
  "tanggalSelesai": "2024-07-19",
  "jenis": "KBM",
  "keterangan": null
}
```

---

### Jadwal Mengajar (Schedules)

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/jadwal` | ✅ | Jadwal mengajar guru yang login |
| GET | `/jadwal?teacherId=id` | ✅ SchoolAdmin | Jadwal guru tertentu |
| POST | `/jadwal` | ✅ | Tambah jadwal |
| PATCH | `/jadwal/:id` | ✅ | Update jadwal |
| DELETE | `/jadwal/:id` | ✅ | Hapus jadwal |

**Response array** (sudah di-join dengan nama mapel dan nama guru):
```json
[{
  "id": "uuid",
  "teacherId": "budi-santoso",
  "teacherName": "Budi Santoso",
  "subjectId": "uuid",
  "subjectName": "Matematika - VII Ibnu Battutah",
  "kelas": "VII Ibnu Battutah",
  "hari": "Senin",
  "jamMulai": "07:30",
  "jamSelesai": "09:00",
  "createdAt": "..."
}]
```

---

### Program Semester (Prosem)

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/prosem` | ✅ | Daftar prosem milik guru |
| POST | `/prosem` | ✅ | Buat prosem baru |
| DELETE | `/prosem/:id` | ✅ | Hapus prosem |
| GET | `/prosem-items?prosemId=uuid` | ✅ | Item-item dalam prosem |
| POST | `/prosem-items` | ✅ | Tambah item |
| PATCH | `/prosem-items/:id` | ✅ | Update item |
| DELETE | `/prosem-items/:id` | ✅ | Hapus item |

---

### Tujuan Pembelajaran (TP)

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/tp` | ✅ | List TP guru yang login |
| GET | `/tp?subjectId=uuid&calendarId=uuid` | ✅ | Filter |
| POST | `/tp` | ✅ | Buat TP |
| PATCH | `/tp/:id` | ✅ | Update TP |
| DELETE | `/tp/:id` | ✅ | Hapus TP |
| POST | `/tp/bulk` | ✅ | Bulk insert |
| POST | `/tp/reorder` | ✅ | Reorder nomor TP |
| POST | `/tp/import/analyze` | ✅ | AI parse file → preview TP |

---

### Info Pekanan

```
GET /info-pekanan?calendarId=uuid&weekId=uuid
```
Mengembalikan status pelaksanaan prosem untuk pekan tertentu:

```json
{
  "weekId": "uuid",
  "pekanKe": 3,
  "tanggalMulai": "2024-07-29",
  "tanggalSelesai": "2024-08-02",
  "jenis": "KBM",
  "totalRencana": 5,
  "totalSesuai": 3,
  "totalTertinggal": 1,
  "totalDiDepan": 0,
  "items": [{
    "prosemItemId": "uuid | null",
    "subjectId": "uuid",
    "subjectName": "Matematika - VII Ibnu Battutah",
    "kelas": "VII Ibnu Battutah",
    "kd": "3.1",
    "materi": "PLSV",
    "jp": 2,
    "status": "sesuai | tertinggal | belum | di_depan",
    "journalEntryId": "uuid | null"
  }]
}
```

**Status item**:
- `sesuai` — ada jurnal yang cocok dengan prosem item ini di pekan ini
- `tertinggal` — ada di rencana tapi belum ada jurnal, dan pekan sudah lewat
- `belum` — ada di rencana, pekan belum tiba
- `di_depan` — ada jurnal tapi tidak ada dalam rencana prosem

---

### Bahan Ajar

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/bahan-ajar` | ✅ | List bahan ajar sekolah (tanpa file blob) |
| GET | `/bahan-ajar/:id/file` | ✅ | Download file (stream binary) |
| POST | `/bahan-ajar` | ✅ | Upload bahan ajar |
| DELETE | `/bahan-ajar/:id` | ✅ | Hapus |

**POST /bahan-ajar** — body JSON (file sebagai base64):
```json
{
  "judul": "Modul PLSV",
  "mataPelajaran": "Matematika",
  "kelas": "VII",
  "deskripsi": "Modul untuk pertemuan 1",
  "fileName": "modul-plsv.pdf",
  "fileType": "application/pdf",
  "fileSize": 102400,
  "fileData": "base64string...",
  "linkUrl": null
}
```

> `fileData` dan `linkUrl` saling opsional — bisa salah satu.

---

### Rekap (Kesiswaan & Kurikulum)

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/rekap/absensi` | ✅ | Rekap absensi per kelas/bulan |
| GET | `/rekap/nilai` | ✅ | Rekap nilai per mapel |
| GET | `/kepsek/overview` | ✅ SchoolAdmin | Data ringkasan kepala sekolah |
| GET | `/kesiswaan/overview` | ✅ | Data ringkasan kesiswaan |
| GET | `/kurikulum/overview` | ✅ | Data ringkasan kurikulum |

---

### Dashboard

```
GET /dashboard/summary
```
Response:
```json
{
  "totalSiswa": 120,
  "totalGuru": 15,
  "totalDokumen": 42,
  "jurnalHariIniTerisi": true,
  "progresJurnalBulanIni": [
    { "minggu": "Minggu 1", "jumlah": 5 },
    { "minggu": "Minggu 2", "jumlah": 4 },
    { "minggu": "Minggu 3", "jumlah": 6 },
    { "minggu": "Minggu 4", "jumlah": 3 }
  ],
  "kelengkapanAdministrasiPersen": 56,
  "schoolName": "SMP Al-Falah",
  "tahunAjaran": "2024/2025",
  "semester": "Ganjil"
}
```

---

### Kotak Masuk (Inbox)

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/inbox` | ✅ | Daftar thread percakapan per siswa |
| GET | `/inbox/:studentId` | ✅ | Pesan dalam thread satu siswa |
| POST | `/inbox/:studentId/read` | ✅ | Tandai pesan siswa sebagai sudah dibaca |
| POST | `/inbox/:studentId` | ✅ | Kirim balasan ke siswa |

**GET /inbox** — response array thread:
```json
[{
  "studentId": "text-id",
  "studentName": "Ahmad Fauzi",
  "lastMessage": "Pak, mau izin...",
  "lastMessageAt": "2024-08-01T10:00:00Z",
  "unreadCount": 2
}]
```

**POST /inbox/:studentId** — body:
```json
{ "body": "Baik, terima kasih sudah memberi tahu." }
```

> ⚠️ `studentId` di inbox adalah `text` (ID dari sistem TOMAT), **bukan** UUID dari `guru_eob5_students`.

---

### Akun Siswa

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| GET | `/student-accounts` | ✅ | List akun siswa yang sudah dibuat |
| POST | `/student-accounts/generate` | ✅ SchoolAdmin | Generate akun untuk satu siswa |
| POST | `/student-accounts/generate-all` | ✅ SchoolAdmin | Generate akun untuk semua siswa |
| GET | `/student-accounts/:studentId/card` | ✅ | Download kartu akun PDF |

---

### AI Features

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| POST | `/modul-ajar/generate` | ✅ | Generate modul ajar dengan AI |
| GET | `/modul-ajar` | ✅ | List modul ajar yang dihasilkan |
| GET | `/modul-ajar/:id` | ✅ | Detail modul ajar |
| DELETE | `/modul-ajar/:id` | ✅ | Hapus modul ajar |
| POST | `/soal-otomatis/generate` | ✅ | Generate soal dengan AI |
| GET | `/soal-otomatis` | ✅ | List soal yang dihasilkan |

---

## 5. Aturan Multi-Tenancy (School Scoping)

> **PENTING**: Ini adalah sumber utama bug "data tidak muncul" di aplikasi mobile.

### Cara Kerja

Setiap guru punya field `school` di profil. **Semua query data** secara otomatis difilter berdasarkan `school` guru yang sedang login:

```
guru.school → filter students, attendance, grades, calendars, dll
```

### Konsekuensi yang sering menyebabkan data kosong:

1. **Guru belum punya `school`**: Jika `guru.school` adalah `null` atau `""`, maka:
   - `GET /students` → `[]` (array kosong)
   - `GET /attendance` → `[]`
   - `GET /grades` → `[]`
   - `GET /academic-calendars` → `[]`
   - Semua fitur yang bergantung pada data siswa tidak akan menampilkan data

2. **Siswa dari sekolah berbeda**: Setiap request ke `/students`, `/attendance`, dll hanya mengembalikan siswa dari sekolah yang sama dengan guru yang login.

3. **Subjects hanya milik guru sendiri**: `GET /subjects` hanya mengembalikan mapel milik guru yang sedang login — tidak ada filter sekolah, tapi tidak bisa melihat mapel guru lain.

4. **Journal hanya milik guru sendiri**: `GET /journal` = jurnal pribadi guru tersebut saja.

### Flowchart verifikasi data kosong:

```
Data kosong?
    ↓
Cek GET /auth/me → apakah "school" terisi?
    ↓ Tidak
Minta guru update profil / set school
    ↓ Ya
Cek GET /students → apakah ada siswa?
    ↓ Tidak
Siswa belum diinput oleh admin sekolah
    ↓ Ya
Data harusnya muncul — cek filter query params
```

---

## 6. Tipe Data & Enum

### Jabatan Guru
```
"kepala_sekolah" | "wakasek" | "guru" | "wali_kelas"
```

### Mata Pelajaran (mapel)
```
"B. Indonesia" | "IPA" | "IPS" | "PKN" | "Matematika" | "Seni Teater" | "TIK" | 
"PJOK" | "SKI" | "Do'a dan Hadits" | "B. Arab" | "B. Sunda" | "English" | 
"PAI" | "Bimbingan Konseling"
```

### Kelas yang tersedia
```
"VII Ibnu Battutah" | "VIII Ibnu Sina" | "IX Al Khawarizmi"
```
> Ini adalah nilai default di kode — sekolah lain mungkin menggunakan nama kelas berbeda.

### Wakasek Bidang
```
"Kurikulum" | "Kesiswaan"
```

### Status Absensi
```
"hadir" | "izin" | "sakit" | "alpa"
```

### Jenis Nilai
```
"formatif" | "sumatif_lm" | "sumatif_tengah" | "sumatif_akhir"
```

### Jenis Poin
```
"positif" | "negatif"
```

### Hari
```
"Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu"
```

### Jenis Kelamin Siswa
```
"L" | "P"
```

### Status Info Pekanan
```
"sesuai" | "tertinggal" | "belum" | "di_depan"
```

---

## 7. Error Handling

Semua error dikembalikan dalam format:
```json
{ "error": "Pesan error dalam bahasa Indonesia" }
```

| HTTP Code | Artinya |
|---|---|
| 400 | Validasi gagal / data tidak valid |
| 401 | Belum login / sesi tidak valid |
| 403 | Login tapi tidak punya izin (bukan admin) |
| 404 | Data tidak ditemukan (atau bukan milik sekolah yang sama) |
| 409 | Konflik — data sudah ada (misal: username sudah dipakai) |
| 500 | Error server internal |

> ⚠️ **404 vs data kosong**: Server sengaja mengembalikan 404 atau array kosong `[]` (bukan 403) saat data dari sekolah lain diakses — ini untuk mencegah **enumeration attack**. Jangan bingungkan dengan "data tidak ada".

---

## 8. Alur Fitur Utama

### Alur Input Absensi Harian

```
1. GET /auth/me
   → ambil info guru, pastikan school terisi

2. GET /students?kelas=VII+Ibnu+Battutah
   → ambil daftar siswa kelas yang akan diabsen

3. POST /attendance/bulk-mixed
   Body: {
     tanggal: "YYYY-MM-DD",
     entries: [
       { studentId: "uuid", status: "hadir" },
       { studentId: "uuid", status: "sakit" },
       ...
     ]
   }
   → server melakukan upsert per siswa

4. GET /attendance?kelas=VII+Ibnu+Battutah&date=YYYY-MM-DD
   → verifikasi data tersimpan
```

### Alur Input Jurnal

```
1. GET /subjects
   → ambil daftar mapel guru ini

2. POST /journal
   Body: { subjectId, tanggal, kelas, materi, catatan?, prosemItemId? }
```

### Alur Input Nilai

```
1. GET /students?kelas=...
   → ambil siswa

2. GET /subjects
   → ambil mapel (subjectId)

3. GET /academic-calendars
   → ambil kalender (calendarId)

4. POST /grades
   Body: { studentId, subjectId, calendarId, jenis, lingkupMateri?, tpNumber?, nilai }
```

### Alur Baca Pesan Siswa (Inbox)

```
1. GET /inbox
   → daftar thread + unreadCount

2. GET /inbox/:studentId
   → semua pesan dalam thread

3. POST /inbox/:studentId/read
   → tandai sudah dibaca

4. POST /inbox/:studentId
   Body: { body: "..." }
   → kirim balasan
```

> ⚠️ `studentId` di inbox adalah ID dari sistem TOMAT (tipe `text`), berbeda dengan UUID siswa di `guru_eob5_students`. Pastikan mengambil ID ini dari response GET /inbox, bukan dari GET /students.

---

## Catatan Penting untuk Developer Mobile

1. **Sesi berbasis cookie** — simpan dan kirim ulang cookie `connect.sid` setiap request. Pada HTTP client native (Kotlin/Swift/Flutter), pastikan `cookieJar` aktif.

2. **Format tanggal selalu `YYYY-MM-DD`** (bukan Unix timestamp, bukan ISO8601 dengan jam).

3. **UUID vs text ID**:
   - Guru: `id` = **text** (slug username, misal `budi-santoso`)
   - Siswa, mapel, nilai, dll: `id` = **UUID**

4. **School scoping adalah kunci** — jika `school` guru kosong, hampir semua endpoint mengembalikan data kosong. Ini fitur, bukan bug.

5. **Subjects auto-sync** — panggil `GET /subjects` minimal sekali setelah login untuk memicu auto-pembuatan folder mapel dari profil guru.

6. **File bahan ajar tidak ikut di GET list** — kolom `file_data` (base64) dikecualikan dari `GET /bahan-ajar`. Download file via endpoint terpisah `GET /bahan-ajar/:id/file`.

7. **Rekap absensi berbeda dari list absensi**:
   - `GET /attendance` = data mentah per siswa
   - `GET /attendance/rekap` = agregat per kelas per tanggal

8. **isAdmin di profil guru** = `kepala_sekolah` ATAU username `edwardliu7` (platform admin).

# GuruEOB5

Platform administrasi sekolah berbasis web untuk guru dan staf sekolah. Dirancang untuk membantu guru mengelola kegiatan belajar-mengajar sehari-hari secara digital, mulai dari absensi hingga pembuatan bahan ajar dengan bantuan AI.

---

## Fitur Utama

### 📋 Absensi
Pencatatan kehadiran siswa per hari per kelas. Guru dapat mengisi absensi secara massal (satu kelas sekaligus) maupun individual, dengan status: **Hadir, Izin, Sakit, Alpa**. Rekap absensi per kelas dan per periode tersedia untuk wali kelas dan kepala sekolah.

### 📊 Nilai & Poin
Pencatatan nilai akademik siswa per mata pelajaran dan per jenis penilaian. Sistem poin perilaku untuk mencatat prestasi atau catatan sikap siswa, lengkap dengan rekap per kelas.

### 📓 Jurnal Mengajar
Guru mencatat jurnal kegiatan pembelajaran harian: materi yang diajarkan, kelas, mata pelajaran, dan catatan. Dapat dilihat oleh kepala sekolah dan koordinator kurikulum sebagai monitoring.

### 📅 Jadwal Pelajaran
Pengelolaan jadwal pelajaran per kelas dan per hari. Mendukung impor jadwal massal dari file spreadsheet.

### 📁 Modul Ajar (AI)
Generate modul ajar otomatis menggunakan AI. Guru memasukkan topik, kelas, dan tujuan pembelajaran — sistem menghasilkan modul lengkap yang bisa langsung diunduh sebagai file Word (.docx).

### ❓ Soal Otomatis (AI)
Generate soal latihan atau ujian otomatis berbasis AI. Mendukung berbagai jenis soal (pilihan ganda, esai, dll.) dengan tingkat kesulitan yang dapat disesuaikan, dan bisa diunduh sebagai dokumen siap cetak.

### 📚 Program Semester (Prosem)
Perencanaan program semester per mata pelajaran: capaian pembelajaran, alokasi waktu, dan materi per minggu. Dapat diekspor sebagai dokumen resmi.

### 🎯 Tujuan Pembelajaran (TP)
Pengelolaan tujuan pembelajaran per mata pelajaran dan per fase kurikulum. Mendukung impor massal dari file dokumen.

### 👥 Data Siswa
Direktori siswa lengkap per sekolah: data diri, kelas, jenis kelamin, dan NISN. Mendukung impor massal dari spreadsheet dengan validasi AI.

### 🔑 Akun Siswa
Generate akun login untuk siswa (untuk aplikasi siswa). Wali kelas dapat membuat akun per siswa atau sekaligus satu kelas, dan mencetak kartu akun dalam format PDF.

### 📬 Kotak Masuk
Sistem pesan internal antar pengguna dalam satu sekolah.

### 📆 Kalender Akademik
Pengelolaan kalender akademik sekolah: hari libur, minggu efektif, dan semester aktif.

### 🗂️ Bahan Ajar
Penyimpanan dan pengelolaan bahan ajar (materi, dokumen referensi) per mata pelajaran.

---

## Peran Pengguna

| Peran | Akses |
|---|---|
| **Guru** | Absensi, nilai, poin, jurnal, modul ajar, soal otomatis, prosem, TP, jadwal, bahan ajar |
| **Wali Kelas** | Semua fitur guru + rekap kelas, akun siswa, monitoring kelas |
| **Wakasek Kurikulum** | Monitoring dokumen & jurnal seluruh guru, prosem sekolah |
| **Wakasek Kesiswaan** | Rekap absensi & poin seluruh siswa, direktori siswa |
| **Kepala Sekolah** | Dashboard ringkasan, monitoring seluruh aktivitas guru dan siswa |

---

## Teknologi

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + Drizzle ORM + PostgreSQL (Neon)
- **AI**: Groq — model llama-3.3-70b-versatile (teks) & llama-4-scout (vision)
- **Auth**: Session-based
- **Package manager**: pnpm (monorepo)

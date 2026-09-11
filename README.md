# GuruEOB5

Platform administrasi sekolah berbasis web untuk guru dan staf sekolah. Dirancang untuk membantu guru mengelola kegiatan pembelajaran dan administrasi harian secara digital — mulai dari absensi, penilaian, jurnal mengajar, hingga pembuatan materi dan soal berbasis AI.

Versi ini menyajikan fitur inti untuk meningkatkan efisiensi operasional sekolah dan mendukung monitoring oleh kepala sekolah serta koordinator kurikulum.

---

## Fitur Utama

- 📋 Absensi  
  Pencatatan kehadiran siswa per hari dan per kelas. Dukungan input massal maupun individual dengan status: Hadir, Izin, Sakit, Alpa. Rekap per kelas.

- 📊 Nilai & Poin  
  Pencatatan nilai akademik per mata pelajaran dan jenis penilaian. Sistem poin perilaku untuk mencatat prestasi atau catatan sikap siswa.

- 📓 Jurnal Mengajar  
  Catatan aktivitas pembelajaran harian: materi, kelas, mata pelajaran, dan catatan. Bisa dimonitor oleh kepala sekolah dan koordinator kurikulum.

- 📅 Jadwal Pelajaran  
  Pengelolaan jadwal per kelas dan per hari. Mendukung impor jadwal massal dari spreadsheet.

- 📁 Modul Ajar (AI)  
  Generate modul ajar otomatis menggunakan AI. Input: topik, kelas, tujuan pembelajaran — output modul yang dapat diunduh sebagai .docx.

- ❓ Soal Otomatis (AI)  
  Generate soal latihan/ujian berbasis AI (PG, esai, dll.) dengan pengaturan tingkat kesulitan; ekspor ke dokumen siap cetak.

- 📚 Program Semester (Prosem)  
  Perencanaan prosem: capaian pembelajaran, alokasi waktu, materi mingguan. Ekspor dokumen resmi.

- 🎯 Tujuan Pembelajaran (TP)  
  Pengelolaan tujuan pembelajaran per mata pelajaran dan fase kurikulum. Impor massal didukung.

- 👥 Data Siswa  
  Direktori siswa lengkap: data diri, kelas, NISN. Impor massal dari spreadsheet dengan validasi.

- 🔑 Akun Siswa  
  Generate akun siswa untuk aplikasi siswa. Pembuatan per-siswa atau per-kelas, cetak kartu akun dalam PDF.

- 📬 Kotak Masuk  
  Sistem pesan internal antar pengguna di dalam satu sekolah.

- 📆 Kalender Akademik  
  Pengelolaan hari libur, minggu efektif, dan semester aktif.

- 🗂️ Bahan Ajar  
  Penyimpanan dan pengelolaan materi dan dokumen referensi per mata pelajaran.

---

## Peran Pengguna

| Peran | Akses |
|---|---|
| Guru | Absensi, nilai, poin, jurnal, modul ajar, soal otomatis, prosem, TP, jadwal, bahan ajar |
| Wali Kelas | Semua fitur Guru + rekap kelas, pembuatan akun siswa, monitoring kelas |
| Wakasek Kurikulum | Monitoring dokumen & jurnal seluruh guru, manajemen prosem sekolah |
| Wakasek Kesiswaan | Rekap absensi & poin seluruh siswa, manajemen direktori siswa |
| Kepala Sekolah | Dashboard ringkasan, monitoring seluruh aktivitas guru & siswa |

---

## Teknologi

- Frontend: React + Vite + Tailwind CSS + shadcn/ui  
- Backend: Express.js + Drizzle ORM + PostgreSQL (Neon)  
- AI: Groq — model teks (llama-3.3-70b-versatile) dan vision (llama-4-scout)  
- Auth: Session-based  
- Package manager: pnpm (monorepo)

Catatan: Pastikan kepemilikan/akses model AI dan kredensial layanan dipatuhi sebelum digunakan di produksi.

---

## Persiapan & Instalasi (lokal)

1. Clone repository:
   - git clone https://github.com/edwardliu7-dot/GuruEOB5.git

2. Install dependencies:
   - pnpm install

3. Salin file environment:
   - cp .env.example .env
   - Isi variabel lingkungan seperti DATABASE_URL, AI_API_KEY, SESSION_SECRET, dsb.

4. Migrate database:
   - (Contoh) pnpm --filter backend run migrate

5. Jalankan development:
   - pnpm --filter frontend dev
   - pnpm --filter backend dev

Sesuaikan perintah di atas dengan struktur monorepo dan skrip yang tersedia di package.json.

---

## Konfigurasi (contoh variabel .env)

- DATABASE_URL=postgresql://user:pass@host:port/dbname
- SESSION_SECRET=your_session_secret
- AI_PROVIDER_URL=...
- AI_API_KEY=...

Jangan commit file .env ke repository.

---

## Deployment

- Direkomendasikan menggunakan platform yang mendukung Postgres (Neon) dan environment variables aman.  
- Perhatikan penggunaan model AI yang memerlukan resource besar atau layanan host khusus.

---

## Contribusi

- Fork project, buat branch fitur/bugfix, lalu buat pull request.  
- Sertakan deskripsi perubahan, langkah reproduksi (jika bug), dan test case bila relevan.

---

## Changelog

- README diperbarui untuk mencerminkan perubahan fitur dan dokumentasi dasar. Silakan tambahkan detail changelog per-release di sini.

---

## Lisensi & Kontak

- Lisensi: (tambahkan lisensi, mis. MIT)  
- Penanggung jawab / Contact: edwardliu7-dot (GitHub)

---

Updated: 2026-09-11

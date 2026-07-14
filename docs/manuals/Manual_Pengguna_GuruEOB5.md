# Manual Pengguna — Guru EOB5

**Versi:** 1.0
**Bahasa:** Bahasa Indonesia

---

![Cover](../attached_assets/cover-placeholder.png)

# Manual Pengguna Guru EOB5

Dokumen ini merupakan manual gabungan untuk semua peran pengguna dalam aplikasi Guru EOB5: Guru, Wali Kelas, Kepala Sekolah, Wakasek, dan Admin (Pengelola Sistem). Manual ini berisi panduan operasional, alur kerja utama, contoh kasus, dan panduan troubleshooting.

---

## Daftar Isi

1. Pendahuluan
2. Peran dan Hak Akses
3. Persiapan Awal
4. Panduan Umum (Navigasi & Dashboard)
5. Manual Per Peran
   - 5.1 Guru
   - 5.2 Wali Kelas
   - 5.3 Kepala Sekolah
   - 5.4 Wakasek
   - 5.5 Admin / Pengelola Sistem
6. Pembuatan Dokumen (DOCX / PDF)
7. Contoh Alur Kerja (Use Cases)
8. Export / Import Data & Backup
9. Troubleshooting & FAQ
10. Keamanan dan Praktik Baik
11. Lampiran

---

## 1. Pendahuluan

Guru EOB5 adalah aplikasi administrasi guru yang membantu manajemen akun guru dan siswa, pembuatan dokumen pembelajaran (modul/soal) dan kartu akun siswa, serta fungsi operasional lain yang mendukung proses pembelajaran di sekolah.

Tujuan manual ini adalah memberi panduan langkah-demi-langkah untuk setiap peran agar dapat menggunakan fitur aplikasi secara efektif.

---

## 2. Peran dan Hak Akses

Ringkasan singkat peran:

- Guru: mengelola profil, kelas, siswa, membuat dokumen pembelajaran.
- Wali Kelas: fokus pada manajemen kelas tunggal (absensi, kontak orangtua, laporan perkembangan), akses lebih penuh ke data kelas.
- Kepala Sekolah: akses agregat di tingkat sekolah (laporan, monitoring), dapat memberi persetujuan tertentu.
- Wakasek (Wakil Kepala Sekolah): fokus kurikulum atau administrasi tertentu sesuai tugas sekolah.
- Admin / Pengelola Sistem: hak penuh untuk mengelola pengguna, konfigurasi sistem, dan migrasi data.

Catatan: Hak akses dapat berbeda tergantung kebijakan sekolah. Jika ada perbedaan, konfirmasi kepada admin sekolah.

---

## 3. Persiapan Awal

Sebelum menggunakan aplikasi:

1. Pastikan Anda menerima kredensial (username & password) dari admin.
2. Gunakan browser modern (Chrome/Firefox/Edge) dan izinkan cookie jika diminta.
3. Pastikan jaringan internet stabil untuk operasi upload/download dan pembuatan dokumen.
4. Jika menggunakan server lokal, pastikan admin telah mengatur DATABASE_URL, SESSION_SECRET dan PORT.

---

## 4. Panduan Umum (Navigasi & Dashboard)

Setelah login, antarmuka umum biasanya terdiri dari:
- Header: menampilkan nama pengguna dan tombol logout.
- Sidebar/Menu: Dashboard, Kelas/Siswa, Dokumen, Laporan, Pengaturan.
- Area Konten: menampilkan daftar, form, atau hasil operasi.

Navigasi cepat:
- Dashboard → ringkasan aktivitas dan akses cepat.
- Kelas/Siswa → daftar kelas yang Anda ampu / kelola.
- Dokumen → pembuatan dan daftar hasil dokumen.
- Pengaturan → profil, preferensi, dan (untuk admin) pengaturan sistem.

---

## 5. Manual Per Peran

### 5.1 Guru

Tanggung jawab utama:
- Mengelola profil pribadi.
- Mengelola siswa dan materi untuk kelas yang diampu.
- Menghasilkan dokumen pembelajaran (modul, soal) dan kartu akun siswa.

Langkah penting:
1. Login ke aplikasi.
2. Buka menu "Kelas" → pilih kelas Anda.
3. Tambah siswa: klik "Tambah Siswa" → isi data (nama, NIS, TTL, dsb.) → simpan.
4. Edit siswa: pilih siswa → klik "Edit" → ubah data → simpan.
5. Buat dokumen: menu "Dokumen" → "Buat Baru" → pilih tipe (Modul / Soal / Kartu) → isi form → Generate → Unduh.

Tips:
- Gunakan template import CSV jika tersedia untuk menambah banyak siswa.
- Simpan dokumen lokal setelah generate untuk arsip.

### 5.2 Wali Kelas

Tanggung jawab tambahan terhadap Guru:
- Memantau kehadiran dan perkembangan siswa di kelas.
- Komunikasi dengan orang tua (broadcast atau pesan personal).
- Menyusun laporan semester kelas.

Langkah umum:
1. Absensi harian: buka halaman kelas → form absensi → isi status kehadiran → simpan.
2. Meng-update catatan perkembangan: buka profil siswa → isi catatan → simpan.
3. Mengirim pengumuman: menu Komunikasi/Notifikasi → pilih penerima (kelas) → tulis pesan → kirim.
4. Mencetak daftar hadir atau kartu akun: menu Dokumen → pilih tipe → pilih kelas → Generate → Unduh.

Praktik terbaik:
- Update catatan secara berkala.
- Gunakan export CSV untuk backup data nilai/absensi.

### 5.3 Kepala Sekolah

Fokus:
- Monitoring dan laporan agregat sekolah.
- Persetujuan dan kebijakan akses.

Langkah-langkah umum:
1. Login → Dashboard Kepala Sekolah.
2. Akses laporan: menu Laporan → pilih jenis laporan (rekap guru, siswa, dokumen) → periode → Generate → Unduh.
3. Meminta/supervisi akurasi data: buka profil guru/kelas → periksa data.

Catatan: Akses untuk operasi sensitif biasanya memerlukan hak khusus; hubungi admin jika perlu.

### 5.4 Wakasek

Fokus:
- Mengawasi materi & soal yang diunggah guru.
- Mengelola alur kurikulum dan kualitas bahan ajar.

Langkah-langkah:
1. Login → menu Kurikulum / Materi (jika tersedia).
2. Review materi: buka dokumen yang diunggah guru → beri komentar / persetujuan.
3. Permintaan revisi diteruskan ke guru bersangkutan.

### 5.5 Admin / Pengelola Sistem

Tugas utama:
- Menambah / menonaktifkan akun guru.
- Mengatur environment, migrasi DB, dan monitoring server.
- Melakukan troubleshooting ketika aplikasi bermasalah.

Langkah membuat akun guru:
1. Login sebagai Admin → menu Admin → Pengguna → Tambah Pengguna.
2. Isi data dasar: username, nama, jabatan, email, password awal.
3. Set role (Guru / Wali Kelas / Wakasek / Kepala Sekolah / Admin).
4. Simpan dan informasikan kredensial.

Operasi teknis (untuk admin sys):
- Memeriksa logs: lihat output pino pada server.
- Mengelola sesi: tabel sessions disimpan ke DB (`guru_eob5_session`).
- Menjalankan migrasi: jalankan tool migrasi yang digunakan (lihat folder `migrations/`).

---

## 6. Pembuatan Dokumen (DOCX / PDF)

Jenis dokumen:
- Modul Ajar (DOCX)
- Soal / Kuis (DOCX)
- Kartu Akun Siswa (PDF)

Langkah umum membuat dokumen:
1. Menu "Dokumen" → pilih "Buat Baru".
2. Pilih tipe dokumen.
3. Isi metadata: judul, mapel, kelas, penulis.
4. Isi konten: materi/soal berupa teks atau pilihan (tergantung UI).
5. Klik "Generate".
6. Unduh file ketika proses selesai.

Catatan teknis:
- Dokumen dihasilkan oleh modul backend; proses lama dapat terjadi untuk dokumen berukuran besar.
- Jika terjadi error, catat pesan error dan hubungi admin.

---

## 7. Contoh Alur Kerja (Use Cases)

Use case 1 — Guru membuat modul ajar:
- Login → Dokumen → Buat Modul → isi data → Generate → Unduh.

Use case 2 — Wali Kelas melakukan absensi dan mengirim pengumuman:
- Login → Kelas → Absensi harian → Simpan → Komunikasi → kirim ke orangtua.

Use case 3 — Kepala Sekolah mengunduh laporan bulanan:
- Login → Laporan → pilih periode → Generate → Unduh.

Use case 4 — Admin menambah akun baru:
- Login → Admin → Pengguna → Tambah → isi → Simpan.

---

## 8. Export / Import Data & Backup

Export:
- Fitur Export (CSV/PDF) biasanya tersedia di halaman Kelas atau Laporan.
- Gunakan export untuk membuat backup data siswa, absensi, dan nilai.

Import:
- Jika mendukung import CSV, unduh template import sebelum mengunggah.
- Pastikan kolom sesuai (nama, NIS, kelas, tanggal lahir, dsb.).

Backup DB:
- Admin bertanggung jawab melakukan backup periodik pada level DB.

---

## 9. Troubleshooting & FAQ

Masalah umum dan solusi:
- Login gagal: periksa username/password, jika lupa minta reset ke admin.
- Dokumen gagal generate: coba ulang, periksa jaringan, laporkan ke admin jika berulang.
- Data tidak tampil: periksa hak akses role; hubungi admin.

FAQ singkat:
Q: Siapa admin? A: Admin ditentukan oleh pihak sekolah / developer.
Q: Dimana lokasi file statis frontend? A: Server dapat melayani frontend jika `guru-eob5/dist/public` ada pada deployment.

---

## 10. Keamanan dan Praktik Baik

- Jangan berbagi password.
- Gunakan password yang kuat dan aktifkan mekanisme reset bila tersedia.
- Pastikan deployment production menggunakan HTTPS.
- Simpan `SESSION_SECRET` aman; hanya admin yang memegangnya.

---

## 11. Lampiran

A. Template pesan ke admin (reset password)

```
Subjek: Request Reset Password - [Nama]
Halo Admin,
Saya [Nama], username [username]. Mohon reset password akun saya.
Terima kasih.
```

B. Contoh format CSV import (kolom contoh)
```
username,nama,NIS,kelas,tgl_lahir,email
siswa01,Ahmad,12345,7A,2010-05-12,ahmad@example.com
```

C. Kontak & Pelaporan Bug
- Untuk bug: buka Issue pada repository atau hubungi admin dengan informasi lengkap (langkah reproduksi, screenshot, waktu kejadian).

---

## Penutup

Manual ini dibuat untuk memudahkan pengguna dari berbagai peran. Jika Anda ingin versi PDF, saya bisa membantu menghasilkan PDF dari file Markdown ini atau menaruh file ini di `docs/manuals/` pada repository.

---

*Dokumentasi ini dapat disesuaikan lebih lanjut dengan tangkapan layar, diagram alur, atau instruksi khusus sekolah Anda.*

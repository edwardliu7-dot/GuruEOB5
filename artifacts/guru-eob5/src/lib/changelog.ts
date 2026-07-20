// ─── Changelog ────────────────────────────────────────────────────────────────
// Tambahkan entri baru di PALING ATAS array `RELEASES`.
// Naikkan APP_VERSION ke id release terbaru setiap kali ada pembaruan.
// Format id: "YYYYMMDD" atau "YYYYMMDD-N" jika ada dua rilis sehari.
// ──────────────────────────────────────────────────────────────────────────────

export type ReleaseTag = "Baru" | "Perbaikan" | "Peningkatan" | "Keamanan";

export interface ReleaseItem {
  tag: ReleaseTag;
  text: string;
}

export interface Release {
  id: string;       // used as localStorage key
  date: string;     // "DD Bulan YYYY" — displayed in dialog
  title: string;    // short headline for this release
  items: ReleaseItem[];
}

export const RELEASES: Release[] = [
  {
    id: "20260720-2",
    date: "20 Juli 2026",
    title: "Perbaikan Prosem & Kalender",
    items: [
      {
        tag: "Perbaikan",
        text: "Tambah Materi Prosem: dropdown CP kini muncul pada semua pekan aktif (efektif) — sebelumnya tampil 'Tidak ada KBM' karena tipe pekan tidak dikenali.",
      },
      {
        tag: "Perbaikan",
        text: "Impor AI Prosem: distribusi materi ke pekan aktif kini benar — sebelumnya pekan bertipe 'efektif' diabaikan saat memetakan materi.",
      },
      {
        tag: "Perbaikan",
        text: "Pekan PTS dan PAS kini dikunci sebagai pekan ujian (tidak dapat menerima materi KBM), sama seperti STS dan SAS.",
      },
    ],
  },
  {
    id: "20260720",
    date: "20 Juli 2026",
    title: "Tema, Font & Prosem",
    items: [
      {
        tag: "Baru",
        text: "Pengaturan Tampilan: pilih dari 5 tema warna (Navy, Tosca, Senja, Indigo, Gelap) dan 5 pilihan font — preferensi tersimpan per akun.",
      },
      {
        tag: "Peningkatan",
        text: "Tambah Materi Prosem: form baru per-pekan dengan input CP & JP per minggu, mendukung hingga 3 CP sekaligus dalam satu pekan.",
      },
      {
        tag: "Peningkatan",
        text: "Impor AI Prosem: mendukung semua format file (Excel, PDF, Word, gambar, teks) — hasil impor langsung terbuka di form untuk dikonfirmasi sebelum disimpan.",
      },
    ],
  },
  {
    id: "20250720",
    date: "20 Juli 2025",
    title: "Info Pekanan & Prosem",
    items: [
      {
        tag: "Peningkatan",
        text: "Info Pekanan: kelas & mapel yang sama sekarang digabung dalam satu kartu — tidak lagi terpisah-pisah.",
      },
      {
        tag: "Perbaikan",
        text: "Import Prosem (AI): distribusi materi ke pekan kini otomatis & deterministik jika file tidak punya tanda kolom pekan.",
      },
      {
        tag: "Peningkatan",
        text: "Dialog verifikasi Prosem didesain ulang — tampilan per-pekan, pekan STS/SAS terkunci, validasi wajib isi atau tandai Libur.",
      },
    ],
  },
  {
    id: "20250715",
    date: "15 Juli 2025",
    title: "Modul Ajar & Soal Otomatis",
    items: [
      {
        tag: "Baru",
        text: "Halaman Buat Modul Ajar: generate modul lengkap berbasis CP/TP dengan AI.",
      },
      {
        tag: "Baru",
        text: "Halaman Buat Soal Otomatis: generate soal pilihan ganda, esai, atau uraian singkat.",
      },
      {
        tag: "Peningkatan",
        text: "Sidebar diperbarui — navigasi lebih terstruktur per kategori.",
      },
    ],
  },
  {
    id: "20250708",
    date: "8 Juli 2025",
    title: "Program Semester (Prosem)",
    items: [
      {
        tag: "Baru",
        text: "Halaman Program Semester: buat rencana KBM per pekan, lengkap dengan impor dari Excel.",
      },
      {
        tag: "Baru",
        text: "Impor AI: upload file prosem Excel dan AI memetakan materi ke pekan kalender secara otomatis.",
      },
      {
        tag: "Peningkatan",
        text: "Info Pekanan: kolom Rencana kini terhubung ke Prosem, bukan hanya Jurnal.",
      },
    ],
  },
  {
    id: "20250701",
    date: "1 Juli 2025",
    title: "Kotak Masuk & Feedback",
    items: [
      {
        tag: "Baru",
        text: "Widget Feedback: guru dapat mengirim laporan bug atau saran langsung dari dalam aplikasi.",
      },
      {
        tag: "Baru",
        text: "Admin: Kotak Masuk — kelola dan tandai feedback yang masuk dari seluruh guru.",
      },
      {
        tag: "Peningkatan",
        text: "Badge jumlah pesan belum dibaca muncul di sidebar untuk admin.",
      },
    ],
  },
  {
    id: "20250620",
    date: "20 Juni 2025",
    title: "Peluncuran Awal",
    items: [
      {
        tag: "Baru",
        text: "Dashboard ringkasan capaian mingguan guru.",
      },
      {
        tag: "Baru",
        text: "Jurnal Mengajar, Absensi, Nilai, dan Poin Siswa.",
      },
      {
        tag: "Baru",
        text: "Menu Jabatan: Kepala Sekolah, Wakasek Kurikulum/Kesiswaan, Wali Kelas.",
      },
    ],
  },
];

// Versi yang sedang aktif — harus sama dengan id release teratas
export const APP_VERSION = RELEASES[0].id;
export const STORAGE_KEY = "guru_last_seen_version";

export function hasUnseenUpdate(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== APP_VERSION;
}

export function markAsSeen(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, APP_VERSION);
  }
}

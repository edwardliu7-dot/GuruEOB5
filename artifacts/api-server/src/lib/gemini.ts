import Groq from "groq-sdk";
// pdf-parse v2 ESM types don't declare a default export but esbuild handles it at runtime
// @ts-ignore
import pdfParse from "pdf-parse";

const apiKey = process.env["GROQ_API_KEY"];
if (!apiKey) {
  throw new Error("GROQ_API_KEY environment variable is required");
}

const groq = new Groq({ apiKey });

/** Text model — fast, high-quality, supports JSON mode. */
const TEXT_MODEL = "llama-3.3-70b-versatile";
/** Vision model — supports base64 image input. */
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

/** Call Groq chat completions and return parsed JSON. Throws on empty response. */
async function callJson<T>(
  messages: Groq.Chat.ChatCompletionMessageParam[],
  model: string = TEXT_MODEL,
): Promise<T> {
  const response = await groq.chat.completions.create({
    model,
    messages,
    response_format: { type: "json_object" },
  });
  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Groq returned an empty response");
  }
  return JSON.parse(text) as T;
}

// -----------------------------------------------------------------------
// Student import
// -----------------------------------------------------------------------

export interface MappedStudent {
  nisn?: string;
  namaLengkap: string;
  kelas: string;
  jenisKelamin: "L" | "P";
  school: string;
}

export async function mapRowsToStudents(
  rows: string[][],
  defaultSchool: string | null,
): Promise<MappedStudent[]> {
  const prompt = [
    "Kamu adalah asisten yang memetakan data spreadsheet siswa sekolah Indonesia ke format terstruktur.",
    "Berikut baris-baris mentah hasil pembacaan spreadsheet (baris pertama mungkin header, mungkin juga bukan; kolom bisa dalam urutan apa pun dan nama header bisa bervariasi seperti 'Nama', 'Nama Siswa', 'NIS/NISN', 'Rombel', 'Kelas', 'JK', 'Gender', dsb).",
    "",
    "Tugasmu:",
    "1. Identifikasi kolom mana yang berisi NISN (nomor induk siswa nasional, angka), nama lengkap, kelas/rombel, jenis kelamin, dan sekolah.",
    "2. Kembalikan setiap baris data siswa yang valid sebagai objek. Lewati baris header, baris kosong, baris judul, atau baris yang jelas bukan data siswa.",
    "3. jenisKelamin harus 'L' (laki-laki, pria, male, m) atau 'P' (perempuan, wanita, female, f). Jika tidak dapat ditentukan, gunakan 'L'.",
    "4. Rapikan kapitalisasi nama (Title Case).",
    "5. NISN harus berupa string angka; jika tidak ada, hilangkan field nisn.",
    defaultSchool
      ? `6. Jika kolom sekolah tidak ada di data, gunakan '${defaultSchool}' sebagai school untuk semua siswa.`
      : "6. Jika kolom sekolah tidak ada di data, isi school dengan string kosong.",
    "",
    "Kembalikan JSON dengan format: { \"students\": [ { \"nisn\": \"...\", \"namaLengkap\": \"...\", \"kelas\": \"...\", \"jenisKelamin\": \"L\"|\"P\", \"school\": \"...\" }, ... ] }",
    "",
    "Data:",
    JSON.stringify(rows),
  ].join("\n");

  const result = await callJson<{ students?: unknown }>([
    { role: "user", content: prompt },
  ]);

  if (!result.students || !Array.isArray(result.students)) {
    throw new Error("Groq response missing students array");
  }

  return result.students as MappedStudent[];
}

// -----------------------------------------------------------------------
// Tujuan Pembelajaran (TP) import -- AI recognizes any layout/format
// -----------------------------------------------------------------------

export interface MappedTPItem {
  lingkupMateri: number;
  tpNumber: number;
  description: string;
}

const TP_INSTRUCTIONS = [
  "Kamu adalah asisten kurikulum yang mengekstrak daftar Tujuan Pembelajaran (TP) Kurikulum Merdeka Indonesia dari dokumen guru, apa pun formatnya (tabel, daftar bernomor, paragraf, hasil OCR dari gambar/scan, dsb).",
  "",
  "Struktur data Kurikulum Merdeka: setiap mata pelajaran punya beberapa 'Lingkup Materi' (kelompok/bagian materi besar), dan setiap Lingkup Materi punya beberapa 'Tujuan Pembelajaran' (kalimat capaian belajar siswa) di dalamnya.",
  "",
  "PENTING -- pengenalan istilah: dokumen guru Indonesia memakai berbagai istilah berbeda untuk kedua level ini, dan kamu HARUS mengenali semuanya, bukan hanya istilah baku 'Lingkup Materi' dan 'Tujuan Pembelajaran' persis:",
  "- Level 'Lingkup Materi' (level atas/pengelompokan) bisa juga ditulis sebagai: 'Elemen', 'Domain', 'BAB' / 'Bab' (contoh: 'BAB 1', 'Bab I'), 'Materi Pokok', 'Pokok Bahasan', 'Unit', 'Topik', 'Kompetensi Dasar'/'KD', 'Capaian Pembelajaran'/'CP', 'Fase', atau sekadar judul bagian tanpa label eksplisit (contoh: langsung nama topik seperti 'Bilangan Bulat').",
  "- Level 'Tujuan Pembelajaran' (level bawah/item per baris) bisa juga ditulis sebagai: 'TP', 'Indikator', 'Indikator Pencapaian Kompetensi'/'IPK', 'Sub Materi', 'Materi' (ketika muncul sebagai daftar butir di bawah sebuah BAB/Elemen, bukan sebagai judul bagian itu sendiri), atau kalimat tanpa label sama sekali yang berupa capaian/kemampuan yang diharapkan dikuasai siswa (biasanya diawali kata kerja seperti 'siswa dapat...', 'peserta didik mampu...', 'menjelaskan...', 'menganalisis...').",
  "- Jika sebuah dokumen memakai angka romawi, huruf, atau tanpa nomor sama sekali untuk salah satu level, itu TIDAK berarti data tersebut tidak valid -- tetap ekstrak dan beri nomor urut integer sendiri berdasarkan urutan kemunculan.",
  "",
  "Tugasmu:",
  "1. Cari setiap kelompok level-atas (Lingkup Materi, dengan istilah apa pun di atas) dan tentukan nomor urutnya (integer, mulai dari 1) berdasarkan urutan kemunculan di dokumen, walau dokumen memberi nama/topik/angka romawi alih-alih angka biasa.",
  "2. Untuk setiap kelompok tersebut, cari setiap item level-bawah (Tujuan Pembelajaran, dengan istilah apa pun di atas) di dalamnya dan tentukan nomor urutnya dalam kelompok itu (integer, mulai dari 1).",
  "3. Jika dokumen sama sekali tidak punya pengelompokan dua level (hanya daftar datar berisi kalimat-kalimat capaian belajar), anggap semuanya berada di lingkupMateri 1 dan nomori tpNumber secara berurutan -- JANGAN mengembalikan array kosong hanya karena strukturnya tidak baku.",
  "4. description harus berisi teks lengkap kalimat Tujuan Pembelajaran tersebut, dirapikan (hilangkan penomoran/bullet asli, spasi berlebih, karakter OCR yang rusak), tanpa memotong makna.",
  "5. Abaikan judul dokumen, header/footer, informasi identitas guru/sekolah, atau bagian yang jelas bukan Tujuan Pembelajaran (misalnya kop surat, nama sekolah, tahun ajaran).",
  "6. Tulis dalam Bahasa Indonesia sesuai dokumen asli.",
  "7. Jangan pernah mengembalikan items kosong jika dokumen memuat teks apa pun yang menyerupai daftar materi/capaian belajar -- lebih baik menebak pengelompokan secara wajar daripada mengosongkan hasil.",
  "",
  'Kembalikan JSON dengan format: { "items": [ { "lingkupMateri": 1, "tpNumber": 1, "description": "..." }, ... ] }',
].join("\n");

const TP_FALLBACK_INSTRUCTIONS = [
  "Kamu adalah asisten yang mengekstrak daftar materi/topik pembelajaran dari sebuah dokumen guru Indonesia yang formatnya TIDAK baku atau tidak mengikuti terminologi Kurikulum Merdeka standar.",
  "",
  "Percobaan sebelumnya gagal menemukan struktur baku -- sekarang bersikaplah SANGAT permisif:",
  "1. Anggap dokumen ini terdiri dari satu atau lebih kelompok/bagian (bisa berupa BAB, topik, judul sub-bagian apa pun, atau tanpa pembagian sama sekali).",
  "2. Di dalam setiap kelompok, ekstrak setiap baris/kalimat/butir yang menyebutkan materi, topik, kemampuan, atau capaian belajar sebagai satu item Tujuan Pembelajaran.",
  "3. Jika tidak ada pembagian kelompok yang jelas, masukkan semua item ke lingkupMateri 1.",
  "4. Beri nomor lingkupMateri dan tpNumber secara berurutan berdasarkan urutan kemunculan.",
  "5. Hanya kembalikan items kosong jika dokumen benar-benar tidak memuat teks yang berkaitan dengan materi/topik pembelajaran sama sekali (misalnya dokumen kosong, atau sepenuhnya tidak relevan seperti surat undangan rapat).",
  "6. Tulis description dalam Bahasa Indonesia, dirapikan dari teks asli.",
  "",
  'Kembalikan JSON dengan format: { "items": [ { "lingkupMateri": 1, "tpNumber": 1, "description": "..." }, ... ] }',
].join("\n");

async function runTPExtraction(
  messages: Groq.Chat.ChatCompletionMessageParam[],
): Promise<MappedTPItem[]> {
  const result = await callJson<{ items?: unknown }>(messages);
  if (!result.items || !Array.isArray(result.items)) {
    throw new Error("Groq response missing items array");
  }
  return result.items as MappedTPItem[];
}

async function runTPExtractionWithFallback(
  buildMessages: (instructions: string) => Groq.Chat.ChatCompletionMessageParam[],
): Promise<MappedTPItem[]> {
  const primary = await runTPExtraction(buildMessages(TP_INSTRUCTIONS));
  if (primary.length > 0) return primary;
  return runTPExtraction(buildMessages(TP_FALLBACK_INSTRUCTIONS));
}

/** Spreadsheet rows (already parsed client-side, e.g. from xlsx/csv). */
export async function mapRowsToTP(rows: string[][]): Promise<MappedTPItem[]> {
  return runTPExtractionWithFallback((instructions) => [
    {
      role: "user",
      content: [
        instructions,
        "",
        "Berikut baris-baris mentah hasil pembacaan spreadsheet (kolom bisa dalam urutan apa pun):",
        "",
        "Data:",
        JSON.stringify(rows),
      ].join("\n"),
    },
  ]);
}

/** Plain extracted text (e.g. from a .docx or .txt file). */
export async function mapTextToTP(text: string): Promise<MappedTPItem[]> {
  return runTPExtractionWithFallback((instructions) => [
    {
      role: "user",
      content: [instructions, "", "Berikut isi dokumen:", "", text].join("\n"),
    },
  ]);
}

/**
 * Raw file bytes for supported formats.
 * - Images (png, jpeg, webp, heic, heif): sent directly to Groq's vision model.
 * - PDFs: text is extracted with pdf-parse, then sent to the text model.
 */
export async function mapFileToTP(fileBase64: string, mimeType: string): Promise<MappedTPItem[]> {
  const isImage =
    mimeType === "image/png" ||
    mimeType === "image/jpeg" ||
    mimeType === "image/webp" ||
    mimeType === "image/heic" ||
    mimeType === "image/heif";

  if (isImage) {
    return runTPExtractionWithFallback((instructions) => [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${fileBase64}` },
          },
          { type: "text", text: instructions },
        ],
      } as Groq.Chat.ChatCompletionUserMessageParam,
    ]);
  }

  // PDF: extract text first, then use text model
  if (mimeType === "application/pdf") {
    const buffer = Buffer.from(fileBase64, "base64");
    const { text } = await pdfParse(buffer);
    return mapTextToTP(text);
  }

  // Fallback: treat as plain text
  const text = Buffer.from(fileBase64, "base64").toString("utf-8");
  return mapTextToTP(text);
}

// -----------------------------------------------------------------------
// Buat Modul Ajar (Kurikulum Merdeka lesson-plan generator)
// -----------------------------------------------------------------------

export interface ModulAjarContent {
  judul: string;
  informasiUmum: {
    namaPenyusun: string;
    instansi: string;
    jenjang: string;
    kelas: string;
    kompetensiAwal: string;
    profilPelajarPancasila: string[];
    saranaPrasarana: string[];
    targetPesertaDidik: string;
    modelPembelajaran: string;
    jumlahPertemuan: number;
  };
  komponenInti: {
    tujuanPembelajaran: string[];
    kriteriaKetercapaianTujuanPembelajaran: string[];
    pemahamanBermakna: string;
    pertanyaanPemantik: string[];
    kegiatanPembelajaran: {
      pertemuanKe: number;
      pendahuluan: string;
      kegiatanInti: string;
      penutup: string;
    }[];
    asesmen: {
      asesmenDiagnostik: string;
      asesmenFormatif: string;
      asesmenSumatif: string;
    };
    refleksiGuru: string[];
    refleksiPesertaDidik: string[];
  };
  lampiran: {
    lkpd: string;
    kunciJawabanLkpd: string;
    rubrikPenilaian: string;
    pengayaan: string;
    remedial: string;
    bahanBacaan: string;
    media: string[];
    glosarium: { istilah: string; definisi: string }[];
    daftarPustaka: string[];
  };
}

export async function generateModulAjar(params: {
  mataPelajaran: string;
  materi: string;
  alokasiWaktu: string;
  kelas: string;
  namaPenyusun: string;
  instansi: string;
}): Promise<ModulAjarContent> {
  const prompt = [
    "Kamu adalah pakar kurikulum yang menyusun Modul Ajar Kurikulum Merdeka untuk guru di Indonesia.",
    "Buatkan modul ajar yang lengkap, rinci, dan siap pakai berdasarkan data berikut:",
    `- Mata Pelajaran: ${params.mataPelajaran}`,
    `- Materi/Topik: ${params.materi}`,
    `- Alokasi Waktu: ${params.alokasiWaktu}`,
    `- Kelas: ${params.kelas}`,
    `- Nama Penyusun: ${params.namaPenyusun}`,
    `- Instansi/Sekolah: ${params.instansi}`,
    "",
    "Ketentuan:",
    "1. Tulis dalam Bahasa Indonesia yang baku dan sesuai konteks pendidikan Indonesia.",
    "2. Kegiatan pembelajaran harus dibagi per pertemuan (pendahuluan, kegiatan inti, penutup) sesuai jumlah pertemuan yang wajar untuk alokasi waktu tersebut.",
    "3. LKPD (Lembar Kerja Peserta Didik) harus konkret dan relevan dengan materi, disertai kunci jawaban dan rubrik penilaian yang jelas.",
    "4. Sertakan pengayaan untuk peserta didik yang sudah mencapai tujuan pembelajaran dan remedial untuk yang belum.",
    "5. Sertakan glosarium istilah-istilah kunci dan daftar pustaka yang relevan.",
    "6. Semua field harus terisi dengan konten yang bermakna, tidak boleh kosong atau placeholder generik.",
    "",
    "Kembalikan JSON dengan struktur berikut (semua field wajib diisi):",
    JSON.stringify({
      judul: "string",
      informasiUmum: {
        namaPenyusun: "string",
        instansi: "string",
        jenjang: "string",
        kelas: "string",
        kompetensiAwal: "string",
        profilPelajarPancasila: ["string"],
        saranaPrasarana: ["string"],
        targetPesertaDidik: "string",
        modelPembelajaran: "string",
        jumlahPertemuan: "number",
      },
      komponenInti: {
        tujuanPembelajaran: ["string"],
        kriteriaKetercapaianTujuanPembelajaran: ["string"],
        pemahamanBermakna: "string",
        pertanyaanPemantik: ["string"],
        kegiatanPembelajaran: [
          { pertemuanKe: "number", pendahuluan: "string", kegiatanInti: "string", penutup: "string" },
        ],
        asesmen: {
          asesmenDiagnostik: "string",
          asesmenFormatif: "string",
          asesmenSumatif: "string",
        },
        refleksiGuru: ["string"],
        refleksiPesertaDidik: ["string"],
      },
      lampiran: {
        lkpd: "string",
        kunciJawabanLkpd: "string",
        rubrikPenilaian: "string",
        pengayaan: "string",
        remedial: "string",
        bahanBacaan: "string",
        media: ["string"],
        glosarium: [{ istilah: "string", definisi: "string" }],
        daftarPustaka: ["string"],
      },
    }),
  ].join("\n");

  return callJson<ModulAjarContent>([{ role: "user", content: prompt }]);
}

// -----------------------------------------------------------------------
// Buat Soal Otomatis (auto quiz/question generator)
// -----------------------------------------------------------------------

export interface SoalQuestion {
  nomor: number;
  tipe: "pilihan_ganda" | "esai";
  pertanyaan: string;
  pilihan: string[];
  jawabanBenar: string;
  pembahasan: string;
}

export interface SoalContent {
  judul: string;
  petunjukPengerjaan: string;
  soal: SoalQuestion[];
}

export async function generateSoal(params: {
  mataPelajaran: string;
  materi: string;
  jumlahSoal: number;
  jenisSoal: "pilihan_ganda" | "esai";
  tingkatKesulitan: "mudah" | "sedang" | "sulit";
}): Promise<SoalContent> {
  const prompt = [
    "Kamu adalah guru berpengalaman yang menyusun soal latihan untuk siswa di Indonesia.",
    `Buatkan ${params.jumlahSoal} soal untuk mata pelajaran ${params.mataPelajaran} dengan materi/topik "${params.materi}".`,
    `Jenis soal: ${params.jenisSoal === "pilihan_ganda" ? "pilihan ganda (4 opsi jawaban A-D)" : "esai (uraian)"}.`,
    `Tingkat kesulitan: ${params.tingkatKesulitan}.`,
    "",
    "Ketentuan:",
    '1. tipe pada setiap objek soal harus sesuai jenis soal yang diminta ("pilihan_ganda" atau "esai").',
    '2. Untuk soal pilihan_ganda: field "pilihan" berisi tepat 4 opsi tanpa huruf/label (contoh: "Mitokondria", bukan "A. Mitokondria"), dan "jawabanBenar" berisi teks opsi yang benar persis sama dengan salah satu isi "pilihan".',
    '3. Untuk soal esai: field "pilihan" berupa array kosong, dan "jawabanBenar" berisi kunci jawaban/model jawaban yang lengkap.',
    '4. field "pembahasan" berisi penjelasan singkat mengapa jawaban tersebut benar.',
    "5. Nomori soal berurutan mulai dari 1.",
    "6. Tulis dalam Bahasa Indonesia yang baku dan sesuai jenjang pendidikan Indonesia.",
    "",
    'Kembalikan JSON dengan format: { "judul": "string", "petunjukPengerjaan": "string", "soal": [ { "nomor": 1, "tipe": "pilihan_ganda"|"esai", "pertanyaan": "string", "pilihan": ["string"], "jawabanBenar": "string", "pembahasan": "string" }, ... ] }',
  ].join("\n");

  return callJson<SoalContent>([{ role: "user", content: prompt }]);
}

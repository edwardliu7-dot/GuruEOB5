import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env["GEMINI_API_KEY"];
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

export const gemini = new GoogleGenAI({ apiKey });

export interface MappedStudent {
  nisn?: string;
  namaLengkap: string;
  kelas: string;
  jenisKelamin: "L" | "P";
  school: string;
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    students: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nisn: { type: Type.STRING },
          namaLengkap: { type: Type.STRING },
          kelas: { type: Type.STRING },
          jenisKelamin: { type: Type.STRING, enum: ["L", "P"] },
          school: { type: Type.STRING },
        },
        required: ["namaLengkap", "kelas", "jenisKelamin", "school"],
      },
    },
  },
  required: ["students"],
};

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
    "Data:",
    JSON.stringify(rows),
  ].join("\n");

  const response = await gemini.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  const parsed = JSON.parse(text) as { students?: unknown };
  if (!parsed.students || !Array.isArray(parsed.students)) {
    throw new Error("Gemini response missing students array");
  }

  return parsed.students as MappedStudent[];
}

// -----------------------------------------------------------------------
// Tujuan Pembelajaran (TP) import -- AI recognizes any layout/format
// -----------------------------------------------------------------------

export interface MappedTPItem {
  lingkupMateri: number;
  tpNumber: number;
  description: string;
}

const tpResponseSchema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          lingkupMateri: { type: Type.INTEGER },
          tpNumber: { type: Type.INTEGER },
          description: { type: Type.STRING },
        },
        required: ["lingkupMateri", "tpNumber", "description"],
      },
    },
  },
  required: ["items"],
};

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
].join("\n");

// Used only when the primary structured pass returns zero items. Much more
// permissive: any bullet/numbered/paragraph text that looks like a learning
// objective or topic list should be captured, even without recognizable
// Kurikulum Merdeka terminology.
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
].join("\n");

async function runTPExtraction(
  contents: Parameters<typeof gemini.models.generateContent>[0]["contents"],
): Promise<MappedTPItem[]> {
  const response = await gemini.models.generateContent({
    model: "gemini-2.0-flash",
    contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: tpResponseSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  const parsed = JSON.parse(text) as { items?: unknown };
  if (!parsed.items || !Array.isArray(parsed.items)) {
    throw new Error("Gemini response missing items array");
  }

  return parsed.items as MappedTPItem[];
}

/**
 * Runs the primary structured extraction, and if it comes back empty,
 * automatically retries once with a much more permissive fallback prompt
 * before giving up. This avoids surfacing "AI tidak menemukan..." for
 * documents that use non-standard terminology (e.g. "BAB" instead of
 * "Lingkup Materi") that the strict pass didn't recognize.
 */
async function runTPExtractionWithFallback(
  buildContents: (
    instructions: string,
  ) => Parameters<typeof gemini.models.generateContent>[0]["contents"],
): Promise<MappedTPItem[]> {
  const primary = await runTPExtraction(buildContents(TP_INSTRUCTIONS));
  if (primary.length > 0) return primary;

  return runTPExtraction(buildContents(TP_FALLBACK_INSTRUCTIONS));
}

/** Spreadsheet rows (already parsed client-side, e.g. from xlsx/csv). */
export async function mapRowsToTP(rows: string[][]): Promise<MappedTPItem[]> {
  return runTPExtractionWithFallback((instructions) =>
    [
      instructions,
      "",
      "Berikut baris-baris mentah hasil pembacaan spreadsheet (kolom bisa dalam urutan apa pun):",
      "",
      "Data:",
      JSON.stringify(rows),
    ].join("\n"),
  );
}

/** Plain extracted text (e.g. from a .docx or .txt file). */
export async function mapTextToTP(text: string): Promise<MappedTPItem[]> {
  return runTPExtractionWithFallback((instructions) =>
    [instructions, "", "Berikut isi dokumen:", "", text].join("\n"),
  );
}

/**
 * Raw file bytes for formats Gemini can read natively (PDF, images).
 * Lets the AI "see" the document directly instead of relying on
 * pre-extracted text, so scans/photos of a curriculum table still work.
 */
export async function mapFileToTP(fileBase64: string, mimeType: string): Promise<MappedTPItem[]> {
  return runTPExtractionWithFallback((instructions) => [
    { inlineData: { data: fileBase64, mimeType } },
    { text: instructions },
  ]);
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

const modulAjarResponseSchema = {
  type: Type.OBJECT,
  properties: {
    judul: { type: Type.STRING },
    informasiUmum: {
      type: Type.OBJECT,
      properties: {
        namaPenyusun: { type: Type.STRING },
        instansi: { type: Type.STRING },
        jenjang: { type: Type.STRING },
        kelas: { type: Type.STRING },
        kompetensiAwal: { type: Type.STRING },
        profilPelajarPancasila: { type: Type.ARRAY, items: { type: Type.STRING } },
        saranaPrasarana: { type: Type.ARRAY, items: { type: Type.STRING } },
        targetPesertaDidik: { type: Type.STRING },
        modelPembelajaran: { type: Type.STRING },
        jumlahPertemuan: { type: Type.INTEGER },
      },
      required: [
        "namaPenyusun",
        "instansi",
        "jenjang",
        "kelas",
        "kompetensiAwal",
        "profilPelajarPancasila",
        "saranaPrasarana",
        "targetPesertaDidik",
        "modelPembelajaran",
        "jumlahPertemuan",
      ],
    },
    komponenInti: {
      type: Type.OBJECT,
      properties: {
        tujuanPembelajaran: { type: Type.ARRAY, items: { type: Type.STRING } },
        kriteriaKetercapaianTujuanPembelajaran: { type: Type.ARRAY, items: { type: Type.STRING } },
        pemahamanBermakna: { type: Type.STRING },
        pertanyaanPemantik: { type: Type.ARRAY, items: { type: Type.STRING } },
        kegiatanPembelajaran: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pertemuanKe: { type: Type.INTEGER },
              pendahuluan: { type: Type.STRING },
              kegiatanInti: { type: Type.STRING },
              penutup: { type: Type.STRING },
            },
            required: ["pertemuanKe", "pendahuluan", "kegiatanInti", "penutup"],
          },
        },
        asesmen: {
          type: Type.OBJECT,
          properties: {
            asesmenDiagnostik: { type: Type.STRING },
            asesmenFormatif: { type: Type.STRING },
            asesmenSumatif: { type: Type.STRING },
          },
          required: ["asesmenDiagnostik", "asesmenFormatif", "asesmenSumatif"],
        },
        refleksiGuru: { type: Type.ARRAY, items: { type: Type.STRING } },
        refleksiPesertaDidik: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: [
        "tujuanPembelajaran",
        "kriteriaKetercapaianTujuanPembelajaran",
        "pemahamanBermakna",
        "pertanyaanPemantik",
        "kegiatanPembelajaran",
        "asesmen",
        "refleksiGuru",
        "refleksiPesertaDidik",
      ],
    },
    lampiran: {
      type: Type.OBJECT,
      properties: {
        lkpd: { type: Type.STRING },
        kunciJawabanLkpd: { type: Type.STRING },
        rubrikPenilaian: { type: Type.STRING },
        pengayaan: { type: Type.STRING },
        remedial: { type: Type.STRING },
        bahanBacaan: { type: Type.STRING },
        media: { type: Type.ARRAY, items: { type: Type.STRING } },
        glosarium: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              istilah: { type: Type.STRING },
              definisi: { type: Type.STRING },
            },
            required: ["istilah", "definisi"],
          },
        },
        daftarPustaka: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: [
        "lkpd",
        "kunciJawabanLkpd",
        "rubrikPenilaian",
        "pengayaan",
        "remedial",
        "bahanBacaan",
        "media",
        "glosarium",
        "daftarPustaka",
      ],
    },
  },
  required: ["judul", "informasiUmum", "komponenInti", "lampiran"],
};

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
  ].join("\n");

  const response = await gemini.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: modulAjarResponseSchema,
      // Disable thinking: structured JSON output is more reliable without it,
      // and the extra latency / token cost from thinking is not needed here.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response for modul ajar");
  }
  return JSON.parse(text) as ModulAjarContent;
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

const soalResponseSchema = {
  type: Type.OBJECT,
  properties: {
    judul: { type: Type.STRING },
    petunjukPengerjaan: { type: Type.STRING },
    soal: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nomor: { type: Type.INTEGER },
          tipe: { type: Type.STRING, enum: ["pilihan_ganda", "esai"] },
          pertanyaan: { type: Type.STRING },
          pilihan: { type: Type.ARRAY, items: { type: Type.STRING } },
          jawabanBenar: { type: Type.STRING },
          pembahasan: { type: Type.STRING },
        },
        required: ["nomor", "tipe", "pertanyaan", "pilihan", "jawabanBenar", "pembahasan"],
      },
    },
  },
  required: ["judul", "petunjukPengerjaan", "soal"],
};

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
  ].join("\n");

  const response = await gemini.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: soalResponseSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }
  return JSON.parse(text) as SoalContent;
}

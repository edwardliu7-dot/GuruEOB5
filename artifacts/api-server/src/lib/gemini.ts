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
    model: "gemini-2.5-flash",
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
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: modulAjarResponseSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
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
    model: "gemini-2.5-flash",
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

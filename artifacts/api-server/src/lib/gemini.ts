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

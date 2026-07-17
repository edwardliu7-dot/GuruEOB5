export const JABATAN_OPTIONS = [
  { value: "kepala_sekolah", label: "Kepala Sekolah" },
  { value: "wakasek", label: "Wakil Kepala Sekolah (Wakasek)" },
  { value: "guru", label: "Guru" },
  { value: "wali_kelas", label: "Wali Kelas" },
] as const;

export const JABATAN_LABELS: Record<string, string> = {
  kepala_sekolah: "Kepala Sekolah",
  wakasek: "Wakasek",
  guru: "Guru",
  wali_kelas: "Wali Kelas",
};

export const WAKASEK_BIDANG_OPTIONS = ["Kurikulum", "Kesiswaan"] as const;

export const KELAS_OPTIONS = [
  "VII Ibnu Batuttah",
  "VIII Ibnu Sina",
  "IX Al Khawarizmi",
] as const;

export const SCHOOL_OPTIONS = [
  "SMP TISA Islamic School",
  "SDS TISA Islamic School",
  "TK TISA Islamic School",
] as const;

export const MAPEL_OPTIONS = [
  "B. Indonesia",
  "IPA",
  "IPS",
  "PKN",
  "Matematika",
  "Seni Teater",
  "TIK",
  "PJOK",
  "SKI",
  "Do'a dan Hadits",
  "B. Arab",
  "B. Sunda",
  "English",
  "PAI",
  "Bimbingan Konseling",
] as const;

export function formatJabatan(jabatan: string[] | undefined): string {
  if (!jabatan || jabatan.length === 0) return "Guru";
  return jabatan.map((j) => JABATAN_LABELS[j] ?? j).join(", ");
}
